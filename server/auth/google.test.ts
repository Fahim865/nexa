import { describe, expect, it } from "vitest";
import { createGoogleOpenId } from "../db";
import { isSafeReturnPath } from "./google";

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
});
