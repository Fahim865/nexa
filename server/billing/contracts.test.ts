import { describe, expect, it } from "vitest";
import { billingCheckoutInputSchema } from "./contracts";

describe("billing checkout plan selection", () => {
  it.each(["monthly", "annual"] as const)("accepts the trusted %s cadence selector", plan => {
    expect(billingCheckoutInputSchema.parse({ plan }).plan).toBe(plan);
  });

  it("rejects client-provided provider price identifiers and return origins", () => {
    expect(() => billingCheckoutInputSchema.parse({
      plan: "monthly",
      providerPriceId: "pri_untrusted_browser_value",
      successUrl: "https://preview.manus.computer/welcome",
    })).toThrow();
  });
});
