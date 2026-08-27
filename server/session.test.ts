import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";

describe("session token compatibility", () => {
  it("keeps sessions verifiable when an OAuth profile has no display name", async () => {
    const openId = "google-user-without-name";
    const token = await sdk.createSessionToken(openId, { name: "" });
    const session = await sdk.verifySession(token);

    expect(session).toMatchObject({
      openId,
      name: openId,
    });
  });
});

