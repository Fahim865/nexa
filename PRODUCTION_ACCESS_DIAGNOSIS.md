# Production access diagnosis

## 2026-08-21 — Google sign-in authorization-start verification

- Production sign-in page at `/sign-in` renders normally and exposes an enabled **Continue with Google** action.
- Direct request to `https://nexapremium-mpo86vkq.manus.space/api/auth/google/start?returnTo=%2Ftools` reaches Google Accounts rather than self-redirecting or returning an application error.
- The authorization request uses the intended client ID, PKCE `S256` challenge, OIDC nonce/state, and callback URL: `https://nexapremium-mpo86vkq.manus.space/api/auth/google/callback`.
- Completing Google account authentication still requires the user’s own account interaction and MFA; credentials are not handled by NEXA or this diagnostic process.

## 2026-08-21 — Premium checkout reproduction

The public `/premium` page renders normally, includes both monthly and annual cadence choices, and keeps Paddle price identifiers out of the client. Selecting **Upgrade to Premium** while unauthenticated returns the intentional message, “Sign in is required before starting a secure checkout.” This confirms the observed checkout block is the server-side authentication guard, not a frontend payment failure. A real Paddle checkout cannot be created until the user has a valid NEXA session from the Google callback.

## 2026-08-21 — Rebuilt checkout handoff verification

- The focused checkout-handoff fix was verified against a rebuilt production server: an unauthenticated **Upgrade to Premium** action now redirects to `/sign-in?returnTo=%2Fpremium%3Fcheckout%3Dsign-in` rather than stopping at a toast-only state.
- The destination renders the enabled Google sign-in action. After the Google callback creates a session, the user can return to the Premium page and start the server-authorized Paddle checkout request.
