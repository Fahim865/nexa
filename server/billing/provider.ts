import type {
  BillingCheckoutRequest,
  BillingCheckoutSession,
  BillingPortalSession,
  VerifiedBillingEvent,
} from "./contracts";

export class BillingProviderError extends Error {
  constructor(message: string, public readonly code: "BILLING_NOT_CONFIGURED" | "BILLING_PROVIDER_ERROR" | "BILLING_INVALID_EVENT") {
    super(message);
    this.name = "BillingProviderError";
  }
}

/**
 * Provider-neutral adapter contract. A future adapter owns checkout creation,
 * signed-webhook verification, and provider-side cancellation/portal actions.
 */
export interface BillingProvider {
  readonly name: string;
  createCheckoutSession(request: BillingCheckoutRequest): Promise<BillingCheckoutSession>;
  verifyCheckoutSession(sessionId: string, applicationUserId: number): Promise<VerifiedBillingEvent | null>;
  cancelSubscription(input: { providerCustomerId: string; providerSubscriptionId: string }): Promise<void>;
  createBillingPortalSession(input: { providerCustomerId: string; returnUrl: string }): Promise<BillingPortalSession>;
  verifyWebhook(input: { rawBody: Buffer; signature?: string; headers: Record<string, string | string[] | undefined> }): Promise<VerifiedBillingEvent>;
}

const providers = new Map<string, BillingProvider>();

/** Future integrations register an adapter at server startup; no provider is selected here. */
export function registerBillingProvider(provider: BillingProvider) {
  providers.set(provider.name, provider);
}

export function getConfiguredBillingProvider() {
  const configuredName = process.env.NEXA_BILLING_PROVIDER?.trim();
  if (!configuredName || configuredName === "none") return null;
  return providers.get(configuredName) ?? null;
}

export function requireBillingProvider() {
  const provider = getConfiguredBillingProvider();
  if (!provider) {
    throw new BillingProviderError(
      "Billing is not configured yet. Premium access can only be activated after a verified provider event.",
      "BILLING_NOT_CONFIGURED",
    );
  }
  return provider;
}
