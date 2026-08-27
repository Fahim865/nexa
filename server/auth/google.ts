import axios from "axios";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { ENV } from "../_core/env";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";

const GOOGLE_OAUTH_COOKIE = "nexa_google_oauth";
const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";
const OAUTH_MAX_AGE_MS = 10 * 60 * 1000;

export function normalizeGoogleOAuthEnvironmentValue(value: string) {
  return value.trim();
}

function getGoogleOAuthConfiguration() {
  return {
    clientId: normalizeGoogleOAuthEnvironmentValue(ENV.googleClientId),
    clientSecret: normalizeGoogleOAuthEnvironmentValue(ENV.googleClientSecret),
    redirectUri: normalizeGoogleOAuthEnvironmentValue(ENV.googleRedirectUri),
  };
}

export function getSafeGoogleOAuthCallbackFailureDetails(error: unknown) {
  if (axios.isAxiosError(error)) {
    return {
      category: "provider" as const,
      status: error.response?.status,
      code: error.code,
    };
  }
  return { category: "internal" as const };
}

type GoogleOAuthCookie = {
  state: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  startedAt: number;
  linkOpenId?: string;
};

type GoogleClaims = {
  sub: string;
  email: string;
  name: string | null;
};

function base64Url(bytes: Buffer) {
  return bytes.toString("base64url");
}

function getCookie(req: Request, key: string) {
  return parseCookieHeader(req.headers.cookie ?? "")[key];
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isSafeReturnPath(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"));
}

function getReturnTo(req: Request) {
  const requested = typeof req.query.returnTo === "string" ? req.query.returnTo : undefined;
  return isSafeReturnPath(requested) ? requested : "/";
}

function getCookieOptions(req: Request) {
  const sessionOptions = getSessionCookieOptions(req);
  return {
    ...sessionOptions,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: OAUTH_MAX_AGE_MS,
  };
}

function getCookieClearOptions(req: Request) {
  const { maxAge: _maxAge, ...cookieOptions } = getCookieOptions(req);
  return cookieOptions;
}

function isValidRedirectUri(value: string) {
  try {
    const url = new URL(value);
    return url.pathname === GOOGLE_CALLBACK_PATH && (url.protocol === "https:" || url.hostname === "localhost");
  } catch {
    return false;
  }
}

function getConfiguredOAuthStartUrl(returnTo: string) {
  const callbackUrl = new URL(getGoogleOAuthConfiguration().redirectUri);
  const startUrl = new URL("/api/auth/google/start", callbackUrl.origin);
  startUrl.searchParams.set("returnTo", returnTo);
  return startUrl.toString();
}

function isRequestOnConfiguredOAuthHost(req: Request) {
  try {
    const callbackUrl = new URL(getGoogleOAuthConfiguration().redirectUri);
    const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const acceptedHosts = new Set([callbackUrl.host.toLowerCase()]);
    if (vercelProductionUrl) {
      const productionUrl = new URL(
        vercelProductionUrl.startsWith("http") ? vercelProductionUrl : `https://${vercelProductionUrl}`,
      );
      acceptedHosts.add(productionUrl.host.toLowerCase());
    }
    // Production traffic reaches Express through a reverse proxy. In that case
    // `Host` can be the internal service host, while `X-Forwarded-Host` retains
    // the browser-facing origin that owns the host-only OAuth state cookie.
    const requestHosts = [req.get("x-forwarded-host"), req.get("host")]
      .flatMap((value) => (value ?? "").split(","))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return requestHosts.some((host) => acceptedHosts.has(host));
  } catch {
    return false;
  }
}

export function getGoogleAuthPublicStatus() {
  const config = getGoogleOAuthConfiguration();
  const enabled = Boolean(config.clientId && config.clientSecret && isValidRedirectUri(config.redirectUri));
  return {
    enabled,
    provider: "google" as const,
    callbackPath: GOOGLE_CALLBACK_PATH,
    unavailableReason: enabled ? null : "Google sign-in requires server-side OAuth configuration.",
  };
}

function decodeOAuthCookie(raw: string | undefined): GoogleOAuthCookie | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<GoogleOAuthCookie>;
    if (
      typeof value.state !== "string" ||
      typeof value.codeVerifier !== "string" ||
      typeof value.nonce !== "string" ||
      typeof value.returnTo !== "string" ||
      typeof value.startedAt !== "number" ||
      !isSafeReturnPath(value.returnTo)
    ) return null;
    return value as GoogleOAuthCookie;
  } catch {
    return null;
  }
}

async function maybeCurrentOpenId(req: Request) {
  try {
    return (await sdk.authenticateRequest(req)).openId;
  } catch {
    return undefined;
  }
}

async function exchangeCode(code: string, verification: GoogleOAuthCookie) {
  const config = getGoogleOAuthConfiguration();
  const response = await axios.post<{ id_token?: string }>(
    GOOGLE_TOKEN_ENDPOINT,
    new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: verification.codeVerifier,
    }).toString(),
    { headers: { "content-type": "application/x-www-form-urlencoded" }, timeout: 12_000 },
  );

  if (!response.data.id_token) throw new Error("Google token response did not include an ID token");
  return response.data.id_token;
}

export async function verifyGoogleIdToken(idToken: string, expectedNonce: string): Promise<GoogleClaims> {
  const config = getGoogleOAuthConfiguration();
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    algorithms: ["RS256"],
    audience: config.clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });

  if (payload.nonce !== expectedNonce) throw new Error("Google ID token nonce did not match");
  if (typeof payload.sub !== "string" || !payload.sub) throw new Error("Google ID token subject is missing");
  if (typeof payload.email !== "string" || !payload.email || payload.email_verified !== true) {
    throw new Error("Google account email must be verified");
  }
  if (typeof payload.azp === "string" && payload.azp !== config.clientId) {
    throw new Error("Google ID token authorized party did not match");
  }

  return { sub: payload.sub, email: payload.email, name: typeof payload.name === "string" ? payload.name : null };
}

function redirectToSignInError(res: Response, error: "configuration" | "denied" | "invalid" | "failed") {
  res.redirect(302, `/sign-in?google=${error}`);
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", async (req, res) => {
    if (!getGoogleAuthPublicStatus().enabled) {
      redirectToSignInError(res, "configuration");
      return;
    }

    // The callback is registered to one configured origin. A preview host cannot
    // set a host-only cookie that the production callback will receive, so send
    // the browser to that exact origin before generating state or PKCE material.
    if (!isRequestOnConfiguredOAuthHost(req)) {
      res.redirect(302, getConfiguredOAuthStartUrl(getReturnTo(req)));
      return;
    }

    const state = base64Url(randomBytes(32));
    const codeVerifier = base64Url(randomBytes(48));
    const nonce = base64Url(randomBytes(32));
    const linkOpenId = await maybeCurrentOpenId(req);
    const verification: GoogleOAuthCookie = {
      state,
      codeVerifier,
      nonce,
      returnTo: getReturnTo(req),
      startedAt: Date.now(),
      ...(linkOpenId ? { linkOpenId } : {}),
    };
    res.cookie(GOOGLE_OAUTH_COOKIE, base64Url(Buffer.from(JSON.stringify(verification))), getCookieOptions(req));

    const challenge = base64Url(createHash("sha256").update(codeVerifier).digest());
    const config = getGoogleOAuthConfiguration();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    res.redirect(302, `${GOOGLE_AUTHORIZATION_ENDPOINT}?${params.toString()}`);
  });

  app.get(GOOGLE_CALLBACK_PATH, async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const returnedState = typeof req.query.state === "string" ? req.query.state : undefined;
    const providerError = typeof req.query.error === "string" ? req.query.error : undefined;
    const verification = decodeOAuthCookie(getCookie(req, GOOGLE_OAUTH_COOKIE));
    res.clearCookie(GOOGLE_OAUTH_COOKIE, getCookieClearOptions(req));

    if (!returnedState || !verification || Date.now() - verification.startedAt > OAUTH_MAX_AGE_MS || !safeEquals(returnedState, verification.state)) {
      redirectToSignInError(res, "invalid");
      return;
    }
    if (providerError) {
      redirectToSignInError(res, "denied");
      return;
    }
    if (!code) {
      redirectToSignInError(res, "invalid");
      return;
    }
    if (!getGoogleAuthPublicStatus().enabled) {
      redirectToSignInError(res, "configuration");
      return;
    }

    try {
      const profile = await verifyGoogleIdToken(await exchangeCode(code, verification), verification.nonce);
      const user = verification.linkOpenId
        ? await db.linkGoogleIdentity(verification.linkOpenId, { subject: profile.sub, email: profile.email, name: profile.name })
        : await db.findOrCreateGoogleUser({ subject: profile.sub, email: profile.email, name: profile.name });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, verification.returnTo);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", getSafeGoogleOAuthCallbackFailureDetails(error));
      redirectToSignInError(res, "failed");
    }
  });
}
