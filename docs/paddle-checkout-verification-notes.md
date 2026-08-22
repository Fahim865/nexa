# Paddle checkout verification notes

## 2026-08-22 production observation

The authenticated Monthly Premium checkout created transaction `txn_01m0m642c249any4mypf3x8a3e` and redirected the browser to the configured NEXA default payment-link origin with `?_ptxn=...`, rather than opening a payment surface. The NEXA page does not currently load Paddle.js, so the `_ptxn` query is not consumed and no checkout opens.

## Official Paddle behavior

Paddle documents that `checkout.url` is the configured default payment link plus a `_ptxn` transaction query parameter. That default-link page must include Paddle.js; Paddle.js automatically opens the transaction checkout when it sees the query parameter. Alternatively, a created transaction can be passed to `Paddle.Checkout.open({ transactionId })`.

Sources:

- https://developer.paddle.com/build/transactions/default-payment-link
- https://developer.paddle.com/build/transactions/pass-transaction-checkout

## Scope implication

The provider-side transaction creation is functioning, but the client-side checkout launcher is incomplete. A verified repair must add the public Paddle client token through managed environment configuration, load Paddle.js only on the checkout entry surface, initialize the configured sandbox/live environment explicitly, and open the server-created transaction ID. The API key and webhook secret must remain server-only.

## Client token management API

Paddle documents a server-authenticated `POST /client-tokens` endpoint, requiring `client_token.write`, with `name` and `description` fields. A successful response contains an active environment-scoped Paddle.js token (`test_...` for sandbox or `live_...` for production). Listing existing tokens uses `GET /client-tokens` and requires `client_token.read`. Client tokens are designed to be public; server API keys must not be passed to Paddle.js.

Sources:

- https://developer.paddle.com/api-reference/client-tokens/create-client-token
- https://developer.paddle.com/api-reference/client-tokens/list-client-tokens
- https://developer.paddle.com/paddle-js/about/client-side-tokens
