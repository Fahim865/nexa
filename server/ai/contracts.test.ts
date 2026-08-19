import { describe, expect, it } from "vitest";
import { parseAiRequest } from "./contracts";

describe("AI request contracts", () => {
  it("accepts a complete text-generation request", () => {
    expect(parseAiRequest({
      toolId: "ai-youtube-seo-assistant",
      source: "A practical travel-video editing workflow.",
      shortInput: "Cinematic travel video editing",
      options: { audience: "Creators", intent: "How-to" },
    })).toMatchObject({ toolId: "ai-youtube-seo-assistant" });
  });

  it("requires a secure asset reference for media tools", () => {
    expect(() => parseAiRequest({
      toolId: "ai-subtitle-generator",
      source: "",
      options: { language: "English" },
    })).toThrow();
  });

  it("rejects missing required text before reaching a provider", () => {
    expect(() => parseAiRequest({
      toolId: "ai-translator",
      source: "   ",
      options: {},
    })).toThrow();
  });
});
