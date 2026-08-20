import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";

describe("Premium monthly credit configuration", () => {
  it("returns the server-configured 5,000 monthly allowance through the catalog endpoint", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    await expect(caller.subscription.catalog()).resolves.toMatchObject({
      monthlyPriceUsd: 10,
      monthlyCreditAllowance: 5000,
    });
  });
});
