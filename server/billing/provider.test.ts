import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BillingProviderError,
  createPaddleBillingProvider,
  getConfiguredBillingProvider,
  registerBillingProvider,
  requireBillingProvider,
  type BillingProvider,
} from "./provider";

const testProvider: BillingProvider = {
  name: "test-billing-adapter",
  createCheckoutSession: vi.fn(),
  verifyCheckoutSession: vi.fn(),
  cancelSubscription: vi.fn(),
  createBillingPortalSession: vi.fn(),
  verifyWebhook: vi.fn(),
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("provider-neutral billing boundary", () => {
  it("does not expose a checkout provider when billing is unconfigured", () => {
    vi.stubEnv("NEXA_BILLING_PROVIDER", "none");

    expect(getConfiguredBillingProvider()).toBeNull();
    expect(() => requireBillingProvider()).toThrow(BillingProviderError);
    expect(() => requireBillingProvider()).toThrow("Premium access can only be activated after a verified provider event");
  });

  it("selects only a registered server-side adapter", () => {
    registerBillingProvider(testProvider);
    vi.stubEnv("NEXA_BILLING_PROVIDER", testProvider.name);

    expect(getConfiguredBillingProvider()).toBe(testProvider);
    expect(requireBillingProvider()).toBe(testProvider);
  });
});

describe("Paddle adapter", () => {
  function configurePaddle() {
    vi.stubEnv("PADDLE_ENVIRONMENT", "sandbox");
    vi.stubEnv("PADDLE_API_KEY", "pdl_sdbx_test_key");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "pdl_ntf_test_secret");
    vi.stubEnv("PADDLE_MONTHLY_PRICE_ID", "pri_monthly");
    vi.stubEnv("PADDLE_ANNUAL_PRICE_ID", "pri_annual");
    vi.stubEnv("PADDLE_APP_URL", "https://nexapremium-mpo86vkq.manus.space");
  }

  it("maps a trusted monthly cadence to only the configured monthly Paddle price", async () => {
    configurePaddle();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { id: "txn_monthly", checkout: { url: "https://sandbox-checkout.paddle.com/checkout/txn_monthly" } },
    }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const checkout = await createPaddleBillingProvider().createCheckoutSession({
      plan: "monthly", userId: 17, email: "creator@example.com", monthlyPriceUsd: 10, monthlyCreditAllowance: 5000,
    });

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(checkout.id).toBe("txn_monthly");
    expect(checkout.successUrl).toBe("https://nexapremium-mpo86vkq.manus.space/welcome");
    expect(checkout.cancelUrl).toBe("https://nexapremium-mpo86vkq.manus.space/premium?checkout=cancel");
    expect(request.items).toEqual([{ price_id: "pri_monthly", quantity: 1 }]);
    expect(request.custom_data).toEqual({ nexa_user_id: "17", nexa_plan: "monthly" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://sandbox-api.paddle.com/transactions");
  });

  it("maps a trusted annual cadence to only the configured annual Paddle price", async () => {
    configurePaddle();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { id: "txn_annual", checkout: { url: "https://sandbox-checkout.paddle.com/checkout/txn_annual" } },
    }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await createPaddleBillingProvider().createCheckoutSession({
      plan: "annual", userId: 17, email: null, monthlyPriceUsd: 10, monthlyCreditAllowance: 5000,
    });

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.items).toEqual([{ price_id: "pri_annual", quantity: 1 }]);
    expect(request.custom_data.nexa_plan).toBe("annual");
  });

  it("accepts only a current valid Paddle-Signature and extracts the linked NEXA account", async () => {
    configurePaddle();
    const rawBody = Buffer.from(JSON.stringify({
      event_id: "evt_123", event_type: "subscription.activated", occurred_at: "2026-08-21T00:00:00Z",
      data: {
        id: "sub_123", customer_id: "ctm_123", custom_data: { nexa_user_id: "17" },
        current_billing_period: { starts_at: "2026-08-21T00:00:00Z", ends_at: "2026-09-21T00:00:00Z" },
      },
    }));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const hash = createHmac("sha256", "pdl_ntf_test_secret").update(`${timestamp}:${rawBody.toString("utf8")}`).digest("hex");

    const event = await createPaddleBillingProvider().verifyWebhook({ rawBody, signature: `ts=${timestamp};h1=${hash}`, headers: {} });

    expect(event).toMatchObject({
      provider: "paddle", eventId: "evt_123", type: "subscription_activated",
      providerCustomerId: "ctm_123", providerSubscriptionId: "sub_123", applicationUserId: 17,
    });
    await expect(createPaddleBillingProvider().verifyWebhook({ rawBody, signature: `ts=${timestamp};h1=${"0".repeat(64)}`, headers: {} }))
      .rejects.toMatchObject({ code: "BILLING_INVALID_EVENT" });
  });

  it("links a verified transaction completion to its Paddle subscription rather than its transaction ID", async () => {
    configurePaddle();
    const rawBody = Buffer.from(JSON.stringify({
      event_id: "evt_txn_completed_123", event_type: "transaction.completed", occurred_at: "2026-08-21T00:00:00Z",
      data: {
        id: "txn_123", subscription_id: "sub_456", customer_id: "ctm_123", custom_data: { nexa_user_id: "17", nexa_plan: "annual" },
        current_billing_period: { starts_at: "2026-08-21T00:00:00Z", ends_at: "2027-08-21T00:00:00Z" },
      },
    }));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const hash = createHmac("sha256", "pdl_ntf_test_secret").update(`${timestamp}:${rawBody.toString("utf8")}`).digest("hex");

    const event = await createPaddleBillingProvider().verifyWebhook({ rawBody, signature: `ts=${timestamp};h1=${hash}`, headers: {} });

    expect(event).toMatchObject({
      type: "subscription_activated", providerSubscriptionId: "sub_456", providerCustomerId: "ctm_123", applicationUserId: 17,
    });
  });
});
