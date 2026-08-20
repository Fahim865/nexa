import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";

describe("subscription catalog", () => {
  it("reads the configured Premium price through the lightweight public catalog endpoint", async () => {
    const caller = appRouter.createCaller({
      req: {} as never,
      res: {} as never,
      user: null,
    });

    await expect(caller.subscription.catalog()).resolves.toEqual({
      monthlyPriceUsd: 10,
      cadence: "month",
    });
  });
});
