import express, { type Express } from "express";
import { applyVerifiedBillingEvent } from "./service";
import { BillingProviderError, requireBillingProvider } from "./provider";

/**
 * Registered before JSON parsing so a future provider adapter can verify the exact
 * signed raw payload. No event is trusted or applied without adapter verification.
 */
export function registerBillingWebhookRoutes(app: Express) {
  app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: "2mb" }), async (req, res) => {
    try {
      const provider = requireBillingProvider();
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
      const event = await provider.verifyWebhook({ rawBody, signature: req.header("payment-signature") ?? undefined, headers: req.headers });
      await applyVerifiedBillingEvent(event);
      res.status(200).json({ received: true });
    } catch (error) {
      if (error instanceof BillingProviderError) {
        const status = error.code === "BILLING_NOT_CONFIGURED" ? 503 : 400;
        res.status(status).json({ error: error.message });
        return;
      }
      console.error("[Billing webhook] unexpected error", error);
      res.status(500).json({ error: "Billing event could not be processed." });
    }
  });
}
