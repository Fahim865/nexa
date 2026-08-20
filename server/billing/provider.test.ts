import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BillingProviderError,
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
