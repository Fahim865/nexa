import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../drizzle/schema";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock("../db", () => ({ getDb: getDbMock }));

import {
  CreditServiceError,
  getCreditStatusForUser,
  getCurrentCreditPeriodStart,
  markAiCreditRequestSucceeded,
  refundAiCreditReservation,
  reserveAiCredits,
} from "./service";

function createPremiumUser(overrides: Partial<User> = {}): User {
  const now = new Date("2026-08-20T00:00:00.000Z");
  return {
    id: 7,
    openId: "credit-test-user",
    name: null,
    email: null,
    loginMethod: null,
    role: "user",
    plan: "PREMIUM",
    subscriptionStatus: "ACTIVE",
    subscriptionStartDate: new Date("2026-08-01T00:00:00.000Z"),
    subscriptionEndDate: new Date("2026-09-01T00:00:00.000Z"),
    paymentProvider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    monthlyCreditAllowance: 5000,
    remainingCredits: 5000,
    lastCreditResetDate: new Date("2026-08-01T00:00:00.000Z"),
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    ...overrides,
  };
}

function createReservationDatabase(user: User, recentRequestCount = 0) {
  const updates: unknown[] = [];
  const inserts: unknown[] = [];
  const tx = {
    select: (selection?: unknown) => ({
      from: () => ({
        where: () => selection
          ? [{ requestCount: recentRequestCount }]
          : { for: () => [user] },
      }),
    }),
    update: () => ({
      set: (value: unknown) => ({
        where: async () => { updates.push(value); },
      }),
    }),
    insert: () => ({
      values: async (value: unknown) => { inserts.push(value); },
    }),
  };
  return {
    updates,
    inserts,
    db: { transaction: async (callback: (transaction: typeof tx) => unknown) => callback(tx) },
  };
}

describe("Premium AI credit service", () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  it("uses the subscription anniversary as the monthly reset boundary without carry-over", () => {
    const start = getCurrentCreditPeriodStart({
      subscriptionStartDate: new Date("2026-01-31T12:00:00.000Z"),
      lastCreditResetDate: new Date("2026-01-31T12:00:00.000Z"),
    }, new Date("2026-03-02T12:00:00.000Z"));

    expect(start.toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });

  it("atomically reserves the tool cost and records a RESERVED ledger entry", async () => {
    const user = createPremiumUser();
    const fixture = createReservationDatabase(user);
    getDbMock.mockResolvedValue(fixture.db);

    const reservation = await reserveAiCredits(user.id, "ai-description-generator");

    expect(reservation.credits).toBe(2);
    expect(reservation.remainingCredits).toBe(4998);
    expect(fixture.updates).toContainEqual({ remainingCredits: 4998 });
    expect(fixture.inserts).toContainEqual(expect.objectContaining({
      userId: user.id,
      toolId: "ai-description-generator",
      credits: 2,
      status: "RESERVED",
    }));
  });

  it("rejects an insufficient balance before any provider dispatch reservation exists", async () => {
    const user = createPremiumUser({ remainingCredits: 1 });
    const fixture = createReservationDatabase(user);
    getDbMock.mockResolvedValue(fixture.db);

    await expect(reserveAiCredits(user.id, "ai-description-generator")).rejects.toMatchObject<Partial<CreditServiceError>>({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("Insufficient Premium AI credits"),
    });
    expect(fixture.updates).toEqual([]);
    expect(fixture.inserts).toContainEqual(expect.objectContaining({ status: "REJECTED" }));
  });

  it("verifies the stored Premium subscription before reserving a credit", async () => {
    const user = createPremiumUser({ plan: "FREE", subscriptionStatus: "INACTIVE" });
    const fixture = createReservationDatabase(user);
    getDbMock.mockResolvedValue(fixture.db);

    await expect(reserveAiCredits(user.id, "ai-translator")).rejects.toMatchObject<Partial<CreditServiceError>>({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("Premium subscription required"),
    });
    expect(fixture.updates).toEqual([]);
    expect(fixture.inserts).toEqual([]);
  });

  it("returns stored plan and subscription information alongside the current credit balance", async () => {
    const user = createPremiumUser({ remainingCredits: 4997 });
    const fixture = createReservationDatabase(user);
    getDbMock.mockResolvedValue(fixture.db);

    await expect(getCreditStatusForUser(user.id)).resolves.toMatchObject({
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      monthlyCreditAllowance: 5000,
      remainingCredits: 4997,
    });
  });

  it("marks only a RESERVED request as succeeded with provider and model metadata", async () => {
    const updates: unknown[] = [];
    getDbMock.mockResolvedValue({
      update: () => ({
        set: (value: unknown) => ({
          where: async () => { updates.push(value); },
        }),
      }),
    });

    await markAiCreditRequestSucceeded(
      { requestId: "request-2", userId: 7, toolId: "ai-translator", credits: 1, remainingCredits: 4999 },
      "openai-compatible",
      "gpt-test",
    );

    expect(updates).toContainEqual(expect.objectContaining({
      status: "SUCCEEDED",
      provider: "openai-compatible",
      model: "gpt-test",
    }));
  });

  it("refunds a reserved request exactly once when its provider call fails", async () => {
    const user = createPremiumUser({ remainingCredits: 4998 });
    const transaction = { id: 2, requestId: "request-1", userId: user.id, toolId: "ai-description-generator", credits: 2, status: "RESERVED" };
    const updates: unknown[] = [];
    const selects = [
      { for: () => [transaction] },
      { for: () => [user] },
    ];
    const tx = {
      select: () => ({ from: () => ({ where: () => selects.shift() }) }),
      update: () => ({ set: (value: unknown) => ({ where: async () => { updates.push(value); } }) }),
    };
    getDbMock.mockResolvedValue({ transaction: async (callback: (database: typeof tx) => unknown) => callback(tx) });

    await refundAiCreditReservation({ requestId: "request-1", userId: user.id, toolId: "ai-description-generator", credits: 2, remainingCredits: 4998 }, "upstream unavailable");

    expect(updates).toContainEqual({ remainingCredits: 5000 });
    expect(updates).toContainEqual(expect.objectContaining({ status: "REFUNDED", failureReason: "upstream unavailable" }));
  });
});
