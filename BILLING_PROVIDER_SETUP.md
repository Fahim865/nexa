# NEXA billing provider setup contract

NEXA does not include a payment provider adapter by default. Until a provider adapter is registered at server startup, checkout, portal, cancellation, verification, and the webhook endpoint return a truthful **billing not configured** response and do not change any entitlement.

| Server-only variable | Required when an adapter is added | Purpose |
|---|---:|---|
| `NEXA_BILLING_PROVIDER` | Yes | Registered adapter name; leave unset or `none` until integration. |
| `NEXA_BILLING_API_KEY` | Provider-dependent | Provider API credential. Never expose it to the client. |
| `NEXA_BILLING_WEBHOOK_SECRET` | Yes | Verifies signed raw webhook payloads. |
| `NEXA_BILLING_PORTAL_ENABLED` | No | Enables a provider customer portal when the adapter supports it. |

## Entitlement rule

Only `applyVerifiedBillingEvent`, called after the payment-provider adapter verifies a checkout response or signed webhook, may set `users.plan` to `PREMIUM`. The client checkout button only starts a provider session; it never changes a local plan or credit balance.

The verified activation/renewal event writes `ACTIVE`, subscription dates, provider identifiers, the configured monthly allowance, the full 5,000-credit period balance, and its reset anchor. Verified cancellation scheduling retains access only until the provider-reported end date; expiry, cancellation, and failed payment remove active AI access.
