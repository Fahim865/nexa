import express from "express";
import { request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { createGoogleOpenId } from "../db";
import {
  getGoogleAuthPublicStatus,
  getSafeGoogleOAuthCallbackFailureDetails,
  isSafeReturnPath,
  normalizeGoogleOAuthEnvironmentValue,
  registerGoogleAuthRoutes,
} from "./google";

function requestGoogleStart(port: number, host: string, forwardedHost?: string) {
  return new Promise<{ headers: Record<string, string | string[] | undefined>; statusCode?: number }>((resolve, reject) => {
    const request = httpRequest(
      {
        host: "127.0.0.1",
        port,
        path: "/api/auth/google/start?returnTo=%2Ftools",
        headers: { host, ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : {}) },
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve({ headers: response.headers, statusCode: response.statusCode }));
      },
    );
    request.on("error", reject);
    request.end();
  });
}

function requestGoogleCallback(port: number, host: string, path: string, cookie?: string) {
  return new Promise<{ headers: Record<string, string | string[] | undefined>; statusCode?: number }>((resolve, reject) => {
    const request = httpRequest(
      {
        host: "127.0.0.1",
        port,
        path,
        headers: { host, ...(cookie ? { cookie } : {}) },
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve({ headers: response.headers, statusCode: response.statusCode }));
      },
    );
    request.on("error", reject);
    request.end();
  });
}

describe("Google OAuth safety helpers", () => {
  const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || "https://nexapremium-mpo86vkq.manus.space/api/auth/google/callback";
  const configuredOrigin = new URL(configuredRedirectUri).origin;
  const configuredHost = new URL(configuredRedirectUri).host;

  it("normalizes pasted OAuth environment values before provider use", () => {
    expect(normalizeGoogleOAuthEnvironmentValue("  client-value\n")).toBe("client-value");
  });

  it("keeps OAuth callback logs free of provider request and response payloads", () => {
    const details = getSafeGoogleOAuthCallbackFailureDetails({
      isAxiosError: true,
      code: "ERR_BAD_REQUEST",
      config: { data: "client_secret=must-not-appear" },
      response: { status: 401, data: { client_secret: "must-not-appear" } },
    });

    expect(details).toEqual({ category: "provider", status: 401, code: "ERR_BAD_REQUEST" });
    expect(JSON.stringify(details)).not.toContain("must-not-appear");
  });

  it("accepts only local return paths", () => {
    expect(isSafeReturnPath("/tools")).toBe(true);
    expect(isSafeReturnPath("/tools?view=all")).toBe(true);
    expect(isSafeReturnPath("https://malicious.example")).toBe(false);
    expect(isSafeReturnPath("//malicious.example")).toBe(false);
  });

  it("creates deterministic, opaque session identities for a Google subject", () => {
    const subject = "google-provider-subject-123";
    expect(createGoogleOpenId(subject)).toMatch(/^google_[A-Za-z0-9_-]{43}$/);
    expect(createGoogleOpenId(subject)).toBe(createGoogleOpenId(subject));
    expect(createGoogleOpenId(subject)).not.toContain(subject);
  });

  it("enables the server-only authorization start route when stored OAuth configuration is present", async () => {
    expect(getGoogleAuthPublicStatus().enabled).toBe(true);

    const app = express();
    registerGoogleAuthRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });

    try {
      const address = server.address() as AddressInfo;
      const response = await requestGoogleStart(address.port, configuredHost);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
      expect(response.headers["set-cookie"]?.toString()).toContain("nexa_google_oauth=");
      expect(new URL(response.headers.location!.toString()).searchParams.get("redirect_uri")).toBe(
        configuredRedirectUri,
      );
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("canonicalizes preview-host starts before creating a host-only OAuth state cookie", async () => {
    const app = express();
    registerGoogleAuthRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });

    try {
      const address = server.address() as AddressInfo;
      const response = await requestGoogleStart(address.port, "3000-preview.manus.computer");

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(
        `${configuredOrigin}/api/auth/google/start?returnTo=%2Ftools`,
      );
      expect(response.headers["set-cookie"]).toBeUndefined();
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("accepts Vercel's project production host before issuing OAuth state", async () => {
    const previousProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "finemindai.vercel.app";
    const app = express();
    registerGoogleAuthRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });

    try {
      const address = server.address() as AddressInfo;
      const response = await requestGoogleStart(address.port, "finemindai.vercel.app");

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
      expect(response.headers["set-cookie"]?.toString()).toContain("nexa_google_oauth=");
    } finally {
      if (previousProductionUrl === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      else process.env.VERCEL_PROJECT_PRODUCTION_URL = previousProductionUrl;
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("uses the reverse proxy's browser-facing host before issuing OAuth state", async () => {
    const app = express();
    registerGoogleAuthRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });

    try {
      const address = server.address() as AddressInfo;
      const response = await requestGoogleStart(
        address.port,
        "internal-nexa-service:3000",
        configuredHost,
      );

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
      expect(response.headers["set-cookie"]?.toString()).toContain("nexa_google_oauth=");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("accepts a same-host state cookie on a provider-denied callback and rejects a mismatched state", async () => {
    const app = express();
    registerGoogleAuthRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });

    try {
      const address = server.address() as AddressInfo;
      const host = configuredHost;
      const start = await requestGoogleStart(address.port, host);
      const state = new URL(start.headers.location!.toString()).searchParams.get("state");
      const stateCookie = start.headers["set-cookie"]!.toString().split(";")[0];

      const accepted = await requestGoogleCallback(
        address.port,
        host,
        `/api/auth/google/callback?error=access_denied&state=${encodeURIComponent(state!)}`,
        stateCookie,
      );
      expect(accepted.statusCode).toBe(302);
      expect(accepted.headers.location).toBe("/sign-in?google=denied");
      expect(accepted.headers["set-cookie"]?.toString()).toContain("nexa_google_oauth=;");
      expect(accepted.headers["set-cookie"]?.toString()).not.toContain("Max-Age");

      const rejected = await requestGoogleCallback(
        address.port,
        host,
        "/api/auth/google/callback?error=access_denied&state=wrong-state",
        stateCookie,
      );
      expect(rejected.statusCode).toBe(302);
      expect(rejected.headers.location).toBe("/sign-in?google=invalid");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
