import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb, requireBillingProvider } = vi.hoisted(() => ({ getDb: vi.fn(), requireBillingProvider: vi.fn() }));

vi.mock("../db", () => ({ getDb }));
vi.mock("./provider", async importOriginal => {
  const actual = await importOriginal<typeof import("./provider")>();
  return { ...actual, requireBillingProvider };
});

import { applyVerifiedBillingEvent, verifyCheckoutForUser } from "./service";

const baseUser = {
  id: 41,
  openId: "billing-test-user",
  name: "Billing Test User",
  email: "billing@example.test",
  loginMethod: "manus",
  role: "user",
  plan: "FREE",
  subscriptionStatus: "INACTIVE",
  subscriptionStartDate: null,
  subscriptionEndDate: null,
  paymentProvider: null,
  providerCustomerId: null,
  providerSubscriptionId: null,
  cancelAtPeriodEnd: false,
  monthlyCreditAllowance: 0,
  remainingCredits: 0,
  lastCreditResetDate: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function duplicateSelect(result: unknown[]) {
  return { from: () => ({ where: () => ({ limit: () => ({ for: async () => result }) }) }) };
}

function lockedUserSelect(result: unknown[]) {
  return { from: () => ({ where: () => ({ for: async () => result }) }) };
}

function finalUserSelect(result: unknown[]) {
  return { from: () => ({ where: () => ({ limit: async () => result }) }) };
}

function createTransaction(updatedUser: Record<string, unknown>) {
  return {
    select: vi.fn()
      .mockReturnValueOnce(duplicateSelect([]))
      .mockReturnValueOnce(lockedUserSelect([baseUser]))
      .mockReturnValueOnce(finalUserSelect([updatedUser])),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => undefined) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onDuplicateKeyUpdate: vi.fn(async () => undefined) })) })),
  };
}

describe("verified billing lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getDb.mockReset();
    requireBillingProvider.mockReset();
    vi.stubEnv("PREMIUM_MONTHLY_CREDITS", "5000");
  });

  it("activates Premium only from a verified activation event and resets the paid period allowance", async () => {
    const periodStart = new Date("2026-08-01T00:00:00.000Z");
    const periodEnd = new Date("2026-09-01T00:00:00.000Z");
    const updatedUser = {
      ...baseUser,
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      subscriptionStartDate: periodStart,
      subscriptionEndDate: periodEnd,
      paymentProvider: "provider-adapter",
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      monthlyCreditAllowance: 5000,
      remainingCredits: 5000,
      lastCreditResetDate: periodStart,
    };
    const tx = createTransaction(updatedUser);
    getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) });

    const status = await applyVerifiedBillingEvent({
      provider: "provider-adapter",
      eventId: "evt_activated_123",
      type: "subscription_activated",
      occurredAt: periodStart,
      applicationUserId: baseUser.id,
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      subscriptionStartDate: periodStart,
      subscriptionEndDate: periodEnd,
    });

    expect(status.plan).toBe("PREMIUM");
    expect(status.subscriptionStatus).toBe("ACTIVE");
    expect(status.monthlyCreditAllowance).toBe(5000);
    expect(status.subscriptionStartDate).toEqual(periodStart);
    expect(tx.update).toHaveBeenCalledOnce();
  });

  it("records cancellation scheduling without ending the currently verified Premium period", async () => {
    const periodEnd = new Date("2026-09-01T00:00:00.000Z");
    const updatedUser = {
      ...baseUser,
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      subscriptionEndDate: periodEnd,
      cancelAtPeriodEnd: true,
      monthlyCreditAllowance: 5000,
      remainingCredits: 4810,
    };
    const tx = createTransaction(updatedUser);
    getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) });

    const status = await applyVerifiedBillingEvent({
      provider: "provider-adapter",
      eventId: "evt_cancel_scheduled_123",
      type: "subscription_cancel_scheduled",
      occurredAt: new Date("2026-08-05T00:00:00.000Z"),
      applicationUserId: baseUser.id,
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      subscriptionEndDate: periodEnd,
    });

    expect(status.plan).toBe("PREMIUM");
    expect(status.subscriptionStatus).toBe("ACTIVE");
    expect(status.cancelAtPeriodEnd).toBe(true);
    expect(status.remainingCredits).toBe(4810);
  });

  it("refreshes the configured 5,000-credit allowance only after a verified subscription renewal", async () => {
    const renewalStart = new Date("2026-09-01T00:00:00.000Z");
    const renewalEnd = new Date("2026-10-01T00:00:00.000Z");
    const updatedUser = {
      ...baseUser,
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      subscriptionStartDate: renewalStart,
      subscriptionEndDate: renewalEnd,
      paymentProvider: "paddle",
      providerCustomerId: "ctm_123",
      providerSubscriptionId: "sub_123",
      monthlyCreditAllowance: 5000,
      remainingCredits: 5000,
      lastCreditResetDate: renewalStart,
    };
    const tx = createTransaction(updatedUser);
    getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) });

    const status = await applyVerifiedBillingEvent({
      provider: "paddle", eventId: "evt_renewed_123", type: "subscription_renewed", occurredAt: renewalStart,
      applicationUserId: baseUser.id, providerCustomerId: "ctm_123", providerSubscriptionId: "sub_123",
      subscriptionStartDate: renewalStart, subscriptionEndDate: renewalEnd,
    });

    expect(status.plan).toBe("PREMIUM");
    expect(status.subscriptionStatus).toBe("ACTIVE");
    expect(status.monthlyCreditAllowance).toBe(5000);
    expect(status.remainingCredits).toBe(5000);
  });

  it("removes AI entitlement only after a verified Paddle payment-failure event", async () => {
    const updatedUser = {
      ...baseUser,
      plan: "FREE",
      subscriptionStatus: "PAST_DUE",
      paymentProvider: "paddle",
      providerCustomerId: "ctm_123",
      providerSubscriptionId: "sub_123",
      remainingCredits: 0,
    };
    const tx = createTransaction(updatedUser);
    getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) });

    const status = await applyVerifiedBillingEvent({
      provider: "paddle", eventId: "evt_payment_failed_123", type: "payment_failed", occurredAt: new Date("2026-09-01T00:00:00.000Z"),
      applicationUserId: baseUser.id, providerCustomerId: "ctm_123", providerSubscriptionId: "sub_123",
    });

    expect(status.plan).toBe("FREE");
    expect(status.subscriptionStatus).toBe("PAST_DUE");
    expect(status.remainingCredits).toBe(0);
  });

  it("rejects a verified checkout event whose application user metadata does not match the requester", async () => {
    requireBillingProvider.mockReturnValue({
      verifyCheckoutSession: vi.fn().mockResolvedValue({
        provider: "provider-adapter",
        eventId: "evt_wrong_user_123",
        type: "subscription_activated",
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        applicationUserId: 999,
        providerCustomerId: "cus_other",
        providerSubscriptionId: "sub_other",
      }),
    });

    await expect(verifyCheckoutForUser(baseUser.id, "checkout_session_123")).rejects.toMatchObject({
      code: "BILLING_INVALID_EVENT",
    });
    expect(getDb).not.toHaveBeenCalled();
  });
});
