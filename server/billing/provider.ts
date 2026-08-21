import type {
  BillingPlan,
  BillingCheckoutRequest,
  BillingCheckoutSession,
  BillingPortalSession,
  VerifiedBillingEvent,
} from "./contracts";
import { createHmac, timingSafeEqual } from "node:crypto";

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

type PaddlePeriod = { starts_at?: string; ends_at?: string };
type PaddleApiRecord = Record<string, unknown>;
type PaddleApiResponse = { data?: PaddleApiRecord; error?: { detail?: string; code?: string } };

const PADDLE_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

function paddleBaseUrl() {
  const environment = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
  if (environment === "sandbox") return "https://sandbox-api.paddle.com";
  if (environment === "production") return "https://api.paddle.com";
  throw new BillingProviderError("PADDLE_ENVIRONMENT must be either sandbox or production.", "BILLING_NOT_CONFIGURED");
}

function paddleConfig() {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  const appUrl = process.env.PADDLE_APP_URL?.trim();
  if (!apiKey || !webhookSecret || !appUrl) {
    throw new BillingProviderError("Paddle is not fully configured. Add PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, and PADDLE_APP_URL as server-only variables.", "BILLING_NOT_CONFIGURED");
  }
  let appOrigin: string;
  try {
    appOrigin = new URL(appUrl).origin;
  } catch {
    throw new BillingProviderError("PADDLE_APP_URL must be a valid absolute URL.", "BILLING_NOT_CONFIGURED");
  }
  return { apiKey, webhookSecret, appOrigin };
}

function paddlePriceId(plan: BillingPlan) {
  const configuredPriceId = plan === "monthly"
    ? process.env.PADDLE_MONTHLY_PRICE_ID?.trim()
    : process.env.PADDLE_ANNUAL_PRICE_ID?.trim();
  if (!configuredPriceId) {
    const variable = plan === "monthly" ? "PADDLE_MONTHLY_PRICE_ID" : "PADDLE_ANNUAL_PRICE_ID";
    throw new BillingProviderError(`Paddle ${plan} checkout is unavailable until ${variable} is configured server-side.`, "BILLING_NOT_CONFIGURED");
  }
  return configuredPriceId;
}

function assertSameAppOrigin(url: string, appOrigin: string) {
  try {
    if (new URL(url).origin !== appOrigin) throw new Error("origin mismatch");
  } catch {
    throw new BillingProviderError("Checkout return URLs must stay on the configured NEXA application origin.", "BILLING_PROVIDER_ERROR");
  }
}

async function paddleRequest(path: string, init: RequestInit = {}) {
  const { apiKey } = paddleConfig();
  const response = await fetch(`${paddleBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({})) as PaddleApiResponse;
  if (!response.ok || !payload.data) {
    const detail = payload.error?.detail ?? payload.error?.code ?? `Paddle API returned ${response.status}.`;
    throw new BillingProviderError(`Paddle API request failed: ${detail}`, "BILLING_PROVIDER_ERROR");
  }
  return payload.data;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function dateValue(value: unknown) {
  const raw = stringValue(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function applicationUserIdFrom(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const raw = (value as PaddleApiRecord).nexa_user_id;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function billingPeriodFrom(data: PaddleApiRecord) {
  const period = data.current_billing_period as PaddlePeriod | undefined;
  return {
    subscriptionStartDate: dateValue(period?.starts_at) ?? dateValue(data.started_at),
    subscriptionEndDate: dateValue(period?.ends_at) ?? dateValue(data.next_billed_at) ?? dateValue(data.ends_at),
  };
}

function eventTypeFromPaddle(eventType: string, data: PaddleApiRecord): VerifiedBillingEvent["type"] {
  if (eventType === "subscription.created" || eventType === "subscription.activated" || eventType === "transaction.completed") return "subscription_activated";
  if (eventType === "subscription.updated") {
    const scheduledChange = data.scheduled_change as PaddleApiRecord | null | undefined;
    return scheduledChange?.action === "cancel" ? "subscription_cancel_scheduled" : "subscription_updated";
  }
  if (eventType === "subscription.canceled") return "subscription_canceled";
  if (eventType === "subscription.past_due" || eventType === "transaction.payment_failed") return "payment_failed";
  throw new BillingProviderError(`Paddle webhook event ${eventType} is not configured for NEXA billing.`, "BILLING_INVALID_EVENT");
}

function verifiedEventFromPaddle(payload: PaddleApiRecord): VerifiedBillingEvent {
  const data = payload.data as PaddleApiRecord | undefined;
  const eventId = stringValue(payload.event_id);
  const paddleEventType = stringValue(payload.event_type);
  if (!data || !eventId || !paddleEventType) {
    throw new BillingProviderError("Paddle webhook payload is missing required event fields.", "BILLING_INVALID_EVENT");
  }
  // Subscription webhooks identify the subscription in `data.id`; transaction
  // webhooks identify the transaction there and carry the subscription in
  // `data.subscription_id`. Prefer the latter so all verified events converge
  // on the single provider subscription persisted on the NEXA user record.
  const providerSubscriptionId = stringValue(data.subscription_id) ?? stringValue(data.id);
  const providerCustomerId = stringValue(data.customer_id);
  if (!providerSubscriptionId || !providerCustomerId) {
    throw new BillingProviderError("Paddle billing event is missing subscription or customer identity.", "BILLING_INVALID_EVENT");
  }
  return {
    provider: "paddle",
    eventId,
    type: eventTypeFromPaddle(paddleEventType, data),
    occurredAt: dateValue(payload.occurred_at) ?? new Date(),
    providerCustomerId,
    providerSubscriptionId,
    applicationUserId: applicationUserIdFrom(data.custom_data),
    ...billingPeriodFrom(data),
  };
}

function signaturesFromHeader(header: string | undefined) {
  if (!header) return { timestamp: undefined, hashes: [] as string[] };
  const pairs = header.split(";").map(part => part.trim().split("=", 2));
  const timestamp = pairs.find(([key]) => key === "ts")?.[1];
  return { timestamp, hashes: pairs.filter(([key]) => key === "h1").map(([, value]) => value).filter(Boolean) as string[] };
}

function verifyPaddleSignature(rawBody: Buffer, signature: string | undefined, webhookSecret: string) {
  const { timestamp, hashes } = signaturesFromHeader(signature);
  const timestampMs = Number(timestamp) * 1_000;
  if (!timestamp || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > PADDLE_SIGNATURE_TOLERANCE_MS) {
    throw new BillingProviderError("Paddle webhook signature timestamp is invalid or expired.", "BILLING_INVALID_EVENT");
  }
  const expected = createHmac("sha256", webhookSecret).update(`${timestamp}:${rawBody.toString("utf8")}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const matches = hashes.some(hash => {
    if (!/^[a-f0-9]{64}$/i.test(hash)) return false;
    const candidate = Buffer.from(hash, "hex");
    return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer);
  });
  if (!matches) throw new BillingProviderError("Paddle webhook signature could not be verified.", "BILLING_INVALID_EVENT");
}

export function createPaddleBillingProvider(): BillingProvider {
  return {
    name: "paddle",
    async createCheckoutSession(request) {
      const { appOrigin } = paddleConfig();
      assertSameAppOrigin(request.successUrl, appOrigin);
      assertSameAppOrigin(request.cancelUrl, appOrigin);
      const priceId = paddlePriceId(request.plan);
      const transaction = await paddleRequest("/transactions", {
        method: "POST",
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          ...(request.email ? { customer: { email: request.email } } : {}),
          custom_data: { nexa_user_id: String(request.userId), nexa_plan: request.plan },
        }),
      });
      const checkout = transaction.checkout as PaddleApiRecord | undefined;
      const redirectUrl = stringValue(checkout?.url);
      const id = stringValue(transaction.id);
      if (!id || !redirectUrl) throw new BillingProviderError("Paddle did not return a hosted checkout URL.", "BILLING_PROVIDER_ERROR");
      return { id, redirectUrl };
    },
    async verifyCheckoutSession(sessionId, applicationUserId) {
      const transaction = await paddleRequest(`/transactions/${encodeURIComponent(sessionId)}`);
      if (stringValue(transaction.status) !== "completed" || applicationUserIdFrom(transaction.custom_data) !== applicationUserId) return null;
      const subscriptionId = stringValue(transaction.subscription_id);
      const customerId = stringValue(transaction.customer_id);
      if (!subscriptionId || !customerId) return null;
      const subscription = await paddleRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      const completedAt = dateValue(transaction.updated_at) ?? new Date();
      return {
        provider: "paddle",
        eventId: `checkout:${sessionId}`,
        type: "subscription_activated",
        occurredAt: completedAt,
        providerCustomerId: customerId,
        providerSubscriptionId: subscriptionId,
        applicationUserId,
        ...billingPeriodFrom(subscription),
      };
    },
    async cancelSubscription(input) {
      await paddleRequest(`/subscriptions/${encodeURIComponent(input.providerSubscriptionId)}`, {
        method: "PATCH",
        body: JSON.stringify({ scheduled_change: { action: "cancel", effective_at: "next_billing_period" } }),
      });
    },
    async createBillingPortalSession(input) {
      const { appOrigin } = paddleConfig();
      assertSameAppOrigin(input.returnUrl, appOrigin);
      const portal = await paddleRequest(`/customers/${encodeURIComponent(input.providerCustomerId)}/portal-sessions`, {
        method: "POST",
        body: JSON.stringify({ return_url: input.returnUrl }),
      });
      const urls = portal.urls as PaddleApiRecord | undefined;
      const general = urls?.general as PaddleApiRecord | undefined;
      const redirectUrl = stringValue(general?.overview) ?? stringValue(portal.url);
      if (!redirectUrl) throw new BillingProviderError("Paddle did not return a customer portal URL.", "BILLING_PROVIDER_ERROR");
      return { redirectUrl };
    },
    async verifyWebhook(input) {
      const { webhookSecret } = paddleConfig();
      const signature = input.signature ?? (Array.isArray(input.headers["paddle-signature"]) ? input.headers["paddle-signature"][0] : input.headers["paddle-signature"]);
      verifyPaddleSignature(input.rawBody, signature, webhookSecret);
      let payload: PaddleApiRecord;
      try {
        payload = JSON.parse(input.rawBody.toString("utf8")) as PaddleApiRecord;
      } catch {
        throw new BillingProviderError("Paddle webhook body is not valid JSON.", "BILLING_INVALID_EVENT");
      }
      return verifiedEventFromPaddle(payload);
    },
  };
}

registerBillingProvider(createPaddleBillingProvider());
