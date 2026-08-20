import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";

function createContext(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 1,
    openId: "premium-test-user",
    name: null,
    email: null,
    loginMethod: null,
    role: "user",
    plan: "FREE",
    subscriptionStatus: "INACTIVE",
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    paymentProvider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    ...overrides,
  };
}

describe("AI router", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects an unauthenticated direct AI request before validation or provider dispatch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.ai.translator({
      toolId: "ai-translator",
      source: "",
      options: {},
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a FREE user directly and never calls the AI provider", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const caller = appRouter.createCaller(createContext(createUser()));

    await expect(caller.ai.translator({
      toolId: "ai-translator",
      source: "Translate this sentence.",
      options: {},
    })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Premium subscription required",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an expired Premium entitlement before input validation or provider dispatch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const caller = appRouter.createCaller(createContext(createUser({
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      subscriptionEndDate: new Date(Date.now() - 60_000),
    })));

    await expect(caller.ai.translator({
      toolId: "ai-translator",
      source: "",
      options: {},
    })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Premium subscription required",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("allows an active Premium user to reach request validation", async () => {
    const caller = appRouter.createCaller(createContext(createUser({
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
    })));

    await expect(caller.ai.translator({
      toolId: "ai-translator",
      source: "",
      options: {},
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
