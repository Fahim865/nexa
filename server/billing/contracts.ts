import { z } from "zod";

export const billingPlanSchema = z.enum(["monthly", "annual"]);
export type BillingPlan = z.infer<typeof billingPlanSchema>;

/**
 * The browser may select a billing cadence, but never a provider price identifier.
 * Each provider adapter maps this enum to its own server-only configured price.
 */
export const billingCheckoutInputSchema = z.object({
  plan: billingPlanSchema,
}).strict();

export const billingSessionInputSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
});

export const billingPortalInputSchema = z.object({
  returnUrl: z.string().url().max(2_000),
});

export type BillingLifecycleEventType =
  | "subscription_activated"
  | "subscription_renewed"
  | "subscription_updated"
  | "subscription_cancel_scheduled"
  | "subscription_canceled"
  | "subscription_expired"
  | "payment_failed";

/** This shape is only trusted after a provider adapter has verified its signed event. */
export type VerifiedBillingEvent = {
  provider: string;
  eventId: string;
  type: BillingLifecycleEventType;
  occurredAt: Date;
  providerCustomerId: string;
  providerSubscriptionId: string;
  /** A provider-verifiable application user reference, normally checkout metadata. */
  applicationUserId?: number;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
};

export type BillingCheckoutRequest = z.infer<typeof billingCheckoutInputSchema> & {
  userId: number;
  email: string | null;
  monthlyPriceUsd: number;
  monthlyCreditAllowance: number;
};

export type BillingCheckoutSession = {
  id: string;
  redirectUrl: string;
  /** Canonical server-owned URLs: never derived from the current browser origin. */
  successUrl: string;
  cancelUrl: string;
};

export type BillingPortalSession = {
  redirectUrl: string;
};
