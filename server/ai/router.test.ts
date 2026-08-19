import { describe, expect, it } from "vitest";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AI router", () => {
  it("validates translator input at the public API boundary", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.ai.translator({
      toolId: "ai-translator",
      source: "",
      options: {},
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
