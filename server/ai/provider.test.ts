import { describe, expect, it } from "vitest";
import { parseAiRequest } from "./contracts";
import { AiServiceError, createAiProvider } from "./provider";

describe("AI provider boundary", () => {
  it("refuses requests when no provider is configured and never fabricates output", async () => {
    const provider = createAiProvider({ provider: "disabled", apiKey: "", baseUrl: "", model: "" });
    const request = parseAiRequest({ toolId: "ai-hashtag-generator", source: "A quiet studio launch", options: {} });

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AiServiceError>>({
      code: "PRECONDITION_FAILED",
    });
  });
});
