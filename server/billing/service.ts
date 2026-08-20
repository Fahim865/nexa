import { and, eq, lte, or } from "drizzle-orm";
import { billingEvents, users, type User } from "../../drizzle/schema";
import { getDb } from "../db";
import { getPremiumCatalog, getPremiumMonthlyCreditAllowance } from "../subscriptions/config";
import type { VerifiedBillingEvent } from "./contracts";
import { BillingProviderError, requireBillingProvider } from "./provider";

export type BillingStatus = {
  plan: User["plan"];
  subscriptionStatus: User["subscriptionStatus"];
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  cancelAtPeriodEnd: boolean;
  paymentProvider: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  monthlyPriceUsd: number;
  monthlyCreditAllowance: number;
  remainingCredits: number;
  lastCreditResetDate: Date | null;
};

async function requireDatabase() {
  const db = await getDb();
  if (!db) throw new BillingProviderError("Billing is temporarily unavailable. Please try again later.", "BILLING_PROVIDER_ERROR");
  return db;
}

function toBillingStatus(user: User): BillingStatus {
  const catalog = getPremiumCatalog();
  return {
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionStartDate: user.subscriptionStartDate,
    subscriptionEndDate: user.subscriptionEndDate,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    paymentProvider: user.paymentProvider,
    providerCustomerId: user.providerCustomerId,
    providerSubscriptionId: user.providerSubscriptionId,
    monthlyPriceUsd: catalog.monthlyPriceUsd,
    monthlyCreditAllowance: user.monthlyCreditAllowance,
    remainingCredits: user.remainingCredits,
    lastCreditResetDate: user.lastCreditResetDate,
  };
}

/** Prevent stale records from displaying Premium after their verified paid period has ended. */
async function expireSubscriptionIfDue(userId: number) {
  const db = await requireDatabase();
  const now = new Date();
  await db.update(users).set({
    plan: "FREE",
    subscriptionStatus: "INACTIVE",
    remainingCredits: 0,
    cancelAtPeriodEnd: false,
  }).where(and(
    eq(users.id, userId),
    eq(users.plan, "PREMIUM"),
    or(eq(users.subscriptionStatus, "ACTIVE"), eq(users.subscriptionStatus, "TRIALING")),
    lte(users.subscriptionEndDate, now),
  ));
}

export async function getBillingStatusForUser(userId: number) {
  await expireSubscriptionIfDue(userId);
  const db = await requireDatabase();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new BillingProviderError("Your billing profile could not be found.", "BILLING_PROVIDER_ERROR");
  return toBillingStatus(user);
}

export async function createCheckoutForUser(user: User, input: { successUrl: string; cancelUrl: string }) {
  const provider = requireBillingProvider();
  const catalog = getPremiumCatalog();
  return provider.createCheckoutSession({
    ...input,
    userId: user.id,
    email: user.email,
    monthlyPriceUsd: catalog.monthlyPriceUsd,
    monthlyCreditAllowance: catalog.monthlyCreditAllowance,
  });
}

export async function verifyCheckoutForUser(userId: number, sessionId: string) {
  const provider = requireBillingProvider();
  const event = await provider.verifyCheckoutSession(sessionId, userId);
  if (!event) return { verified: false as const, status: await getBillingStatusForUser(userId) };
  const status = await applyVerifiedBillingEvent(event, userId);
  return { verified: true as const, status };
}

export async function cancelSubscriptionForUser(user: User) {
  if (!user.providerCustomerId || !user.providerSubscriptionId) {
    throw new BillingProviderError("There is no active provider subscription to cancel.", "BILLING_PROVIDER_ERROR");
  }
  const provider = requireBillingProvider();
  // The user action alone never changes local entitlement. Await a verified provider event.
  await provider.cancelSubscription({ providerCustomerId: user.providerCustomerId, providerSubscriptionId: user.providerSubscriptionId });
  return { submitted: true as const };
}

export async function createPortalForUser(user: User, returnUrl: string) {
  if (!user.providerCustomerId) throw new BillingProviderError("There is no provider customer record for this account.", "BILLING_PROVIDER_ERROR");
  const provider = requireBillingProvider();
  return provider.createBillingPortalSession({ providerCustomerId: user.providerCustomerId, returnUrl });
}

async function resolveEventUser(tx: any, event: VerifiedBillingEvent, fallbackUserId?: number) {
  if (fallbackUserId) {
    const [user] = await tx.select().from(users).where(eq(users.id, fallbackUserId)).for("update");
    return user as User | undefined;
  }
  if (event.applicationUserId) {
    const [user] = await tx.select().from(users).where(eq(users.id, event.applicationUserId)).for("update");
    return user as User | undefined;
  }
  const [user] = await tx.select().from(users).where(or(
    eq(users.providerSubscriptionId, event.providerSubscriptionId),
    eq(users.providerCustomerId, event.providerCustomerId),
  )).for("update");
  return user as User | undefined;
}

/** Applies only a signed, provider-verified event. It is deliberately not exposed as a client procedure. */
export async function applyVerifiedBillingEvent(event: VerifiedBillingEvent, expectedUserId?: number) {
  const db = await requireDatabase();
  return db.transaction(async tx => {
    const [duplicate] = await tx.select().from(billingEvents).where(and(
      eq(billingEvents.provider, event.provider),
      eq(billingEvents.eventId, event.eventId),
    )).limit(1).for("update");
    if (duplicate?.status === "APPLIED") {
      const [user] = duplicate.userId ? await tx.select().from(users).where(eq(users.id, duplicate.userId)).limit(1) : [];
      if (!user) throw new BillingProviderError("Verified billing event has no user record.", "BILLING_PROVIDER_ERROR");
      return toBillingStatus(user as User);
    }

    const user = await resolveEventUser(tx, event, expectedUserId);
    if (!user) {
      await tx.insert(billingEvents).values({
        provider: event.provider, eventId: event.eventId, eventType: event.type,
        providerCustomerId: event.providerCustomerId, providerSubscriptionId: event.providerSubscriptionId,
        status: "IGNORED", failureReason: "No matching application user.", occurredAt: event.occurredAt,
      }).onDuplicateKeyUpdate({ set: { status: "IGNORED", failureReason: "No matching application user." } });
      throw new BillingProviderError("Verified billing event could not be linked to an account.", "BILLING_INVALID_EVENT");
    }

    const allowance = getPremiumMonthlyCreditAllowance();
    const start = event.subscriptionStartDate ?? event.occurredAt;
    const end = event.subscriptionEndDate ?? user.subscriptionEndDate;
    let update: Partial<typeof users.$inferInsert>;
    if (event.type === "subscription_activated" || event.type === "subscription_renewed" || event.type === "subscription_updated") {
      update = {
        plan: "PREMIUM", subscriptionStatus: "ACTIVE", subscriptionStartDate: start, subscriptionEndDate: end,
        paymentProvider: event.provider, providerCustomerId: event.providerCustomerId, providerSubscriptionId: event.providerSubscriptionId,
        cancelAtPeriodEnd: false, monthlyCreditAllowance: allowance, remainingCredits: allowance, lastCreditResetDate: start,
      };
    } else if (event.type === "subscription_cancel_scheduled") {
      update = { cancelAtPeriodEnd: true, subscriptionEndDate: end, paymentProvider: event.provider, providerCustomerId: event.providerCustomerId, providerSubscriptionId: event.providerSubscriptionId };
    } else {
      update = {
        plan: "FREE", subscriptionStatus: event.type === "payment_failed" ? "PAST_DUE" : "CANCELED",
        subscriptionEndDate: end, cancelAtPeriodEnd: false, remainingCredits: 0,
      };
    }

    await tx.update(users).set(update).where(eq(users.id, user.id));
    await tx.insert(billingEvents).values({
      provider: event.provider, eventId: event.eventId, eventType: event.type, userId: user.id,
      providerCustomerId: event.providerCustomerId, providerSubscriptionId: event.providerSubscriptionId,
      status: "APPLIED", occurredAt: event.occurredAt,
    }).onDuplicateKeyUpdate({ set: { status: "APPLIED", userId: user.id } });
    const [updated] = await tx.select().from(users).where(eq(users.id, user.id)).limit(1);
    return toBillingStatus(updated as User);
  });
}
