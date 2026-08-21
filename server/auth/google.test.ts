import express from "express";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { createGoogleOpenId } from "../db";
import { getGoogleAuthPublicStatus, isSafeReturnPath, registerGoogleAuthRoutes } from "./google";

describe("Google OAuth safety helpers", () => {
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
      const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/google/start?returnTo=%2Ftools`, {
        redirect: "manual",
      });

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
      expect(response.headers.get("set-cookie")).toContain("nexa_google_oauth=");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
