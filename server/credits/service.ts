import { and, count, eq, gte } from "drizzle-orm";
import { aiCreditTransactions, users, type User } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AiToolId } from "../ai/contracts";
import {
  AI_REQUESTS_PER_USER_PER_MINUTE,
  getAiToolCreditCost,
  getPremiumMonthlyCreditAllowance,
} from "../subscriptions/config";

type CreditErrorCode = "PRECONDITION_FAILED" | "TOO_MANY_REQUESTS" | "INTERNAL_SERVER_ERROR";

export class CreditServiceError extends Error {
  constructor(message: string, public readonly code: CreditErrorCode) {
    super(message);
    this.name = "CreditServiceError";
  }
}

export type CreditReservation = {
  requestId: string;
  userId: number;
  toolId: AiToolId;
  credits: number;
  remainingCredits: number;
};

export type CreditStatus = {
  plan: User["plan"];
  subscriptionStatus: User["subscriptionStatus"];
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  monthlyCreditAllowance: number;
  remainingCredits: number;
  lastCreditResetDate: Date;
  nextCreditResetDate: Date;
};

function addMonths(date: Date, countToAdd: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + countToAdd;
  const targetYear = year + Math.floor(month / 12);
  const targetMonth = ((month % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    Math.min(date.getUTCDate(), lastDay),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  ));
}

/** Returns the current subscription-period anchor without relying on process timers. */
export function getCurrentCreditPeriodStart(user: Pick<User, "subscriptionStartDate" | "lastCreditResetDate">, now = new Date()) {
  const anchor = user.subscriptionStartDate ?? user.lastCreditResetDate ?? now;
  let periodStart = anchor;
  while (addMonths(periodStart, 1).getTime() <= now.getTime()) {
    periodStart = addMonths(periodStart, 1);
  }
  return periodStart;
}

function toStatus(user: User, now: Date): CreditStatus {
  const periodStart = user.lastCreditResetDate ?? getCurrentCreditPeriodStart(user, now);
  return {
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionStartDate: user.subscriptionStartDate,
    subscriptionEndDate: user.subscriptionEndDate,
    monthlyCreditAllowance: user.monthlyCreditAllowance,
    remainingCredits: user.remainingCredits,
    lastCreditResetDate: periodStart,
    nextCreditResetDate: addMonths(periodStart, 1),
  };
}

async function requireDatabase() {
  const db = await getDb();
  if (!db) {
    throw new CreditServiceError("AI credit service is temporarily unavailable. Please try again later.", "INTERNAL_SERVER_ERROR");
  }
  return db;
}

/**
 * Must run while the owning user row is locked. It makes the reset safe across
 * server instances and means unused credits are never carried into a new period.
 */
async function resetDueCredits(tx: any, user: User, now: Date) {
  const periodStart = getCurrentCreditPeriodStart(user, now);
  const resetIsDue = !user.lastCreditResetDate || user.lastCreditResetDate.getTime() < periodStart.getTime();
  if (!resetIsDue) return user;

  const monthlyCreditAllowance = getPremiumMonthlyCreditAllowance();
  await tx.update(users).set({
    monthlyCreditAllowance,
    remainingCredits: monthlyCreditAllowance,
    lastCreditResetDate: periodStart,
  }).where(eq(users.id, user.id));
  return { ...user, monthlyCreditAllowance, remainingCredits: monthlyCreditAllowance, lastCreditResetDate: periodStart };
}

async function lockUser(tx: any, userId: number) {
  const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
  if (!user) {
    throw new CreditServiceError("Your account could not be verified for AI credit usage.", "PRECONDITION_FAILED");
  }
  return user as User;
}

/**
 * The tRPC layer performs the same check before reaching this module. Keeping
 * it here makes direct server-side callers safe too and prevents a future
 * router regression from spending credits for a non-entitled account.
 */
function requireActivePremiumSubscription(user: User, now: Date) {
  const subscriptionIsActive = user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "TRIALING";
  const subscriptionHasNotEnded = !user.subscriptionEndDate || user.subscriptionEndDate.getTime() > now.getTime();

  if (user.plan !== "PREMIUM" || !subscriptionIsActive || !subscriptionHasNotEnded) {
    throw new CreditServiceError("Premium subscription required for AI credit usage.", "PRECONDITION_FAILED");
  }
}

export async function getCreditStatusForUser(userId: number): Promise<CreditStatus> {
  const db = await requireDatabase();
  return db.transaction(async tx => {
    const user = await lockUser(tx, userId);
    const now = new Date();
    requireActivePremiumSubscription(user, now);
    const refreshedUser = await resetDueCredits(tx, user, now);
    return toStatus(refreshedUser, now);
  });
}

export async function reserveAiCredits(userId: number, toolId: AiToolId): Promise<CreditReservation> {
  const db = await requireDatabase();
  const now = new Date();
  const credits = getAiToolCreditCost(toolId);
  const requestId = crypto.randomUUID();
  const outcome = await db.transaction(async tx => {
    const lockedUser = await lockUser(tx, userId);
    requireActivePremiumSubscription(lockedUser, now);
    const user = await resetDueCredits(tx, lockedUser, now);
    const oneMinuteAgo = new Date(now.getTime() - 60_000);
    const [recentUsage] = await tx.select({ requestCount: count() }).from(aiCreditTransactions).where(and(
      eq(aiCreditTransactions.userId, userId),
      gte(aiCreditTransactions.createdAt, oneMinuteAgo),
    ));

    if (Number(recentUsage?.requestCount ?? 0) >= AI_REQUESTS_PER_USER_PER_MINUTE) {
      await tx.insert(aiCreditTransactions).values({
        requestId,
        userId,
        toolId,
        credits,
        status: "REJECTED",
        failureReason: "Per-user AI request rate limit reached.",
      });
      return { type: "rate_limited" as const };
    }

    if (user.remainingCredits < credits) {
      await tx.insert(aiCreditTransactions).values({
        requestId,
        userId,
        toolId,
        credits,
        status: "REJECTED",
        failureReason: "Insufficient Premium AI credits.",
      });
      return { type: "insufficient" as const, remainingCredits: user.remainingCredits };
    }

    const remainingCredits = user.remainingCredits - credits;
    await tx.update(users).set({ remainingCredits }).where(eq(users.id, userId));
    await tx.insert(aiCreditTransactions).values({ requestId, userId, toolId, credits, status: "RESERVED" });
    return { type: "reserved" as const, remainingCredits };
  });

  if (outcome.type === "rate_limited") {
    throw new CreditServiceError("Too many AI requests. Please wait a moment before trying again.", "TOO_MANY_REQUESTS");
  }
  if (outcome.type === "insufficient") {
    throw new CreditServiceError(`Insufficient Premium AI credits. ${outcome.remainingCredits} credits remain in this subscription period.`, "PRECONDITION_FAILED");
  }
  return { requestId, userId, toolId, credits, remainingCredits: outcome.remainingCredits };
}

export async function markAiCreditRequestSucceeded(reservation: CreditReservation, provider: string, model: string) {
  const db = await requireDatabase();
  await db.update(aiCreditTransactions).set({
    status: "SUCCEEDED",
    provider,
    model,
    finalizedAt: new Date(),
  }).where(and(eq(aiCreditTransactions.requestId, reservation.requestId), eq(aiCreditTransactions.status, "RESERVED")));
}

/** Idempotently restores a pre-reserved balance if an upstream provider request fails. */
export async function refundAiCreditReservation(reservation: CreditReservation, failureReason: string) {
  const db = await requireDatabase();
  await db.transaction(async tx => {
    const [transaction] = await tx.select().from(aiCreditTransactions).where(eq(aiCreditTransactions.requestId, reservation.requestId)).for("update");
    if (!transaction || transaction.status !== "RESERVED") return;

    const lockedUser = await lockUser(tx, reservation.userId);
    const user = await resetDueCredits(tx, lockedUser, new Date());
    const remainingCredits = Math.min(user.monthlyCreditAllowance, user.remainingCredits + transaction.credits);
    await tx.update(users).set({ remainingCredits }).where(eq(users.id, reservation.userId));
    await tx.update(aiCreditTransactions).set({
      status: "REFUNDED",
      failureReason: failureReason.slice(0, 1000),
      finalizedAt: new Date(),
    }).where(eq(aiCreditTransactions.requestId, reservation.requestId));
  });
}
