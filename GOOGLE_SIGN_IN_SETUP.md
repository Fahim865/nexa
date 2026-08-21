# Google Sign-in Setup

NEXA's Google sign-in is a **server-side OAuth 2.0 / OpenID Connect authorization-code flow**. The browser never receives the Google client secret, exchanged tokens, or an ID token. The application requests only `openid`, `email`, and `profile`; it does not request Drive, Calendar, Gmail, or other Google API access.

## Required configuration

Create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Configure the consent screen, then add the exact callback below to the OAuth client's authorized redirect URIs:

| Environment variable | Purpose | Example format |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID | `1234567890-example.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Server-only OAuth client secret | Stored only in project secrets |
| `GOOGLE_REDIRECT_URI` | Exact registered callback URI | `https://your-domain.example/api/auth/google/callback` |

Use the deployed NEXA domain in production. The redirect URI must exactly match the URI registered in Google Cloud Console.

## Security controls

The implementation issues a one-time HttpOnly, host-only OAuth state cookie, validates the returned state with timing-safe comparison, binds a PKCE verifier and OpenID nonce to that state, exchanges the authorization code only from the server, and verifies the Google ID token signature, issuer, audience, expiry, and nonce against Google's published JWK set.

The persistent identity key is the verified Google OIDC subject (`sub`), not the email address. Verified email is retained only as profile data. This preserves the existing NEXA user row and therefore its FREE/PREMIUM entitlement, subscription metadata, AI credit balance, and AI usage ledger.

## Reference

The architecture follows Google's server-side OAuth and OpenID Connect guidance: [OAuth 2.0 for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server) and [OpenID Connect server flow](https://developers.google.com/identity/openid-connect/openid-connect). Both require an authorized redirect URI, state-based CSRF protection, server-side authorization-code exchange, and ID-token validation.
