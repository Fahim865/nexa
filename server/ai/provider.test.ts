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

  it("requires a server-only API key before calling an OpenAI-compatible provider", async () => {
    const provider = createAiProvider({ provider: "openai-compatible", apiKey: "", model: "gpt-test" });
    const request = parseAiRequest({ toolId: "ai-translator", source: "Hello", options: {} });

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AiServiceError>>({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("NEXA_AI_PROVIDER_API_KEY"),
    });
  });

  it("sends text requests to the default OpenAI-compatible endpoint and returns only declared output keys", async () => {
    let endpoint = "";
    let requestHeaders: HeadersInit | undefined;
    const provider = createAiProvider(
      { provider: "openai-compatible", apiKey: "server-secret", model: "gpt-test" },
      (async (input, init) => {
        endpoint = String(input);
        requestHeaders = init?.headers;
        return new Response(JSON.stringify({ choices: [{ message: { content: '{"translation":"হ্যালো","notes":"Natural Bengali"}' } }] }), { status: 200 });
      }) as typeof fetch,
    );
    const request = parseAiRequest({ toolId: "ai-translator", source: "Hello", options: { targetLanguage: "Bengali" } });

    await expect(provider.generate(request)).resolves.toMatchObject({
      toolId: "ai-translator",
      outputs: { translation: "হ্যালো", notes: "Natural Bengali" },
      provider: "openai-compatible",
      model: "gpt-test",
    });
    expect(endpoint).toBe("https://api.openai.com/v1/chat/completions");
    expect(new Headers(requestHeaders).get("Authorization")).toBe("Bearer server-secret");
  });

  it("rejects malformed model content instead of inventing a structured result", async () => {
    const provider = createAiProvider(
      { provider: "openai-compatible", apiKey: "server-secret", model: "gpt-test" },
      (async () => new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }), { status: 200 })) as typeof fetch,
    );
    const request = parseAiRequest({ toolId: "ai-hashtag-generator", source: "A quiet studio launch", options: {} });

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AiServiceError>>({
      code: "BAD_GATEWAY",
    });
  });

  it("reports an upstream timeout with a safe provider error", async () => {
    const provider = createAiProvider(
      { provider: "openai-compatible", apiKey: "server-secret", model: "gpt-test", timeoutMs: 5 },
      ((_, init) => new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })) as typeof fetch,
    );
    const request = parseAiRequest({ toolId: "ai-description-generator", source: "A focused project management tool", options: {} });

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AiServiceError>>({
      code: "BAD_GATEWAY",
      message: expect.stringContaining("timed out"),
    });
  });

  it("keeps media tools explicitly unsupported before provider credentials are checked", async () => {
    const provider = createAiProvider({ provider: "disabled" });
    const request = parseAiRequest({ toolId: "ai-subtitle-generator", source: "", assetRef: "https://example.com/source.mp4", options: {} });

    await expect(provider.generate(request)).rejects.toMatchObject<Partial<AiServiceError>>({
      code: "NOT_IMPLEMENTED",
    });
  });
});
