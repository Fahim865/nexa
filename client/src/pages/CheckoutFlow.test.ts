import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const signInSource = fs.readFileSync(path.resolve(import.meta.dirname, "SignIn.tsx"), "utf8");
const welcomeSource = fs.readFileSync(path.resolve(import.meta.dirname, "Welcome.tsx"), "utf8");
const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "..", "App.tsx"), "utf8");

describe("single Premium checkout return flow", () => {
  it("preserves a safe requested return path through Google OAuth start", () => {
    expect(signInSource).toContain('const requestedReturnTo = query.get("returnTo")');
    expect(signInSource).toContain('window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`)');
    expect(signInSource).toContain('!requestedReturnTo.startsWith("//")');
  });

  it("registers a post-checkout welcome route that never treats a redirect as payment verification", () => {
    expect(appSource).toContain('<Route path="/welcome" component={Welcome} />');
    expect(welcomeSource).toContain("A return from checkout never activates Premium by itself.");
    expect(welcomeSource).toContain("trpc.billing.status.useQuery");
  });
});
