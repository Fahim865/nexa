import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const premiumPricingSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "PremiumPricing.tsx"),
  "utf8",
);

describe("PremiumPricing checkout access", () => {
  it("routes unauthenticated upgrade attempts to the secure sign-in path", () => {
    expect(premiumPricingSource).toContain('const returnTo = encodeURIComponent("/premium?checkout=sign-in")');
    expect(premiumPricingSource).toContain('window.location.assign(`/sign-in?returnTo=${returnTo}`)');
  });

  it("keeps checkout creation behind authenticated server-side billing mutation", () => {
    expect(premiumPricingSource).toContain("if (!isAuthenticated)");
    expect(premiumPricingSource).toContain("checkout.mutate({");
    expect(premiumPricingSource).toContain("plan,");
  });

  it("returns from provider checkout to the dedicated truthful welcome page", () => {
    expect(premiumPricingSource).toContain("successUrl: session.successUrl");
    expect(premiumPricingSource).not.toContain("window.location.origin}/welcome");
  });
});
