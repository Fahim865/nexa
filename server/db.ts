import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash } from "node:crypto";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "googleSubject"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByGoogleSubject(googleSubject: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.googleSubject, googleSubject)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export type VerifiedGoogleIdentity = {
  subject: string;
  email: string;
  name: string | null;
};

/**
 * Google subjects can be longer than our legacy 64-character openId column.
 * A namespaced digest gives Google users a deterministic session identity
 * without exposing the provider subject in cookies or logs.
 */
export function createGoogleOpenId(subject: string) {
  return `google_${createHash("sha256").update(subject).digest("base64url")}`;
}

/** Create or update only the identity/profile fields; entitlement columns are never touched here. */
export async function findOrCreateGoogleUser(identity: VerifiedGoogleIdentity) {
  const existing = await getUserByGoogleSubject(identity.subject);
  if (existing) {
    await upsertUser({
      openId: existing.openId,
      googleSubject: identity.subject,
      name: identity.name,
      email: identity.email,
      loginMethod: "google",
      lastSignedIn: new Date(),
    });
    return (await getUserByOpenId(existing.openId)) ?? existing;
  }

  const openId = createGoogleOpenId(identity.subject);
  await upsertUser({
    openId,
    googleSubject: identity.subject,
    name: identity.name,
    email: identity.email,
    loginMethod: "google",
    lastSignedIn: new Date(),
  });

  const created = await getUserByOpenId(openId);
  if (!created) throw new Error("Google user persistence failed");
  return created;
}

/** Link a verified Google identity to the currently signed-in NEXA account without resetting paid state. */
export async function linkGoogleIdentity(openId: string, identity: VerifiedGoogleIdentity) {
  const db = await getDb();
  if (!db) throw new Error("Database is required to link a Google identity");

  const current = await getUserByOpenId(openId);
  if (!current) throw new Error("Current user was not found");

  const existingGoogleUser = await getUserByGoogleSubject(identity.subject);
  if (existingGoogleUser && existingGoogleUser.openId !== openId) {
    throw new Error("This Google account is already linked to a different NEXA account");
  }

  await db.update(users).set({
    googleSubject: identity.subject,
    name: identity.name ?? current.name,
    email: identity.email,
    loginMethod: "google",
    lastSignedIn: new Date(),
  }).where(eq(users.openId, openId));

  return (await getUserByOpenId(openId)) ?? current;
}

// TODO: add feature queries here as your schema grows.
