# Paddle integration requirements

## Official implementation facts

Paddle Billing API uses server-side API keys and exposes customer, transaction, subscription, customer portal, event, notification, and client-token resources. Paddle Checkout creates the subscription when checkout completes; NEXA must not treat checkout creation as an entitlement grant.

All Paddle webhooks send a `Paddle-Signature` header. Verification must use the exact unmodified raw request body and a notification-destination secret. The signed message is `${ts}:${rawBody}`, where `ts` and one or more `h1` values are parsed from the header. NEXA must calculate an HMAC-SHA256 digest and compare it in constant time, while rejecting stale timestamps to reduce replay risk. Only a successfully verified event may enter `applyVerifiedBillingEvent`.

## Required Dashboard-provided values

| Environment variable | Source | Server exposure |
|---|---|---|
| `NEXA_BILLING_PROVIDER` | NEXA configuration | Server-only; value `paddle` when enabled. |
| `PADDLE_ENVIRONMENT` | Paddle Dashboard mode | Server-only; `sandbox` or `production`. |
| `PADDLE_API_KEY` | Paddle Developer tools API key | Server-only secret. |
| `PADDLE_MONTHLY_PRICE_ID` | Paddle catalog price for the $10 monthly Premium subscription | Server-only configuration. |
| `PADDLE_ANNUAL_PRICE_ID` | Paddle catalog price for the configured annual Premium subscription | Server-only configuration. |
| `PADDLE_WEBHOOK_SECRET` | Paddle notification destination for `/api/billing/webhook` | Server-only secret. |
| `PADDLE_CLIENT_TOKEN` | Paddle client-side token, only if browser overlay checkout is selected | Publicly exposed only if required by that chosen UX; it is not a server secret. |
| `PADDLE_APP_URL` | Canonical NEXA public origin | Server-only configuration; `https://nexapremium-mpo86vkq.manus.space`. |

## References

- [Paddle API reference](https://developer.paddle.com/api-reference/overview)
- [Paddle Checkout](https://developer.paddle.com/concepts/sell/self-serve-checkout/)
- [Paddle webhook signature verification](https://developer.paddle.com/webhooks/about/signature-verification/)

## Lifecycle implementation notes

- Create an automatically collected transaction server-side with a provider-selected recurring price and a simple `custom_data` NEXA user reference. Paddle copies transaction custom data to its related subscription, which keeps verified renewal and subscription events associated with the same NEXA account. Sources: https://developer.paddle.com/build/transactions/create-transaction/ and https://developer.paddle.com/build/transactions/custom-data/
- A standard cancellation is effective at the end of the current billing period. Preserve Premium access until the verified end date, then rely on a verified cancellation or expiry event to change entitlement. Source: https://developer.paddle.com/api-reference/subscriptions/cancel-subscription
