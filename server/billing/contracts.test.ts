import { describe, expect, it } from "vitest";
import { billingCheckoutInputSchema } from "./contracts";

const returnUrls = {
  successUrl: "https://nexapremium-mpo86vkq.manus.space/premium?checkout=return",
  cancelUrl: "https://nexapremium-mpo86vkq.manus.space/premium?checkout=cancel",
};

describe("billing checkout plan selection", () => {
  it.each(["monthly", "annual"] as const)("accepts the trusted %s cadence selector", plan => {
    expect(billingCheckoutInputSchema.parse({ plan, ...returnUrls }).plan).toBe(plan);
  });

  it("rejects client-provided provider price identifiers", () => {
    expect(() => billingCheckoutInputSchema.parse({
      plan: "monthly",
      providerPriceId: "pri_untrusted_browser_value",
      ...returnUrls,
    })).toThrow();
  });
});
