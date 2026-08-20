import { ENV } from "../_core/env";
import { AI_OUTPUT_KEYS, MEDIA_AI_TOOL_IDS, type AiRequest } from "./contracts";

type ProviderErrorCode = "PRECONDITION_FAILED" | "NOT_IMPLEMENTED" | "BAD_GATEWAY";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 30_000;

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ProviderErrorCode,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

export type AiServiceResult = {
  toolId: AiRequest["toolId"];
  outputs: Record<string, string>;
  provider: string;
  model: string;
};

export type AiProvider = {
  generate(request: AiRequest): Promise<AiServiceResult>;
};

export type AiProviderConfig = {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

function extractJson(content: string) {
  const trimmed = content.trim();
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(unfenced) as unknown;
  } catch {
    throw new AiServiceError("The configured AI provider did not return the required structured response.", "BAD_GATEWAY");
  }
}

export function normalizeAiOutputs(request: AiRequest, content: string) {
  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AiServiceError("The configured AI provider returned an invalid output shape.", "BAD_GATEWAY");
  }

  const source = parsed as Record<string, unknown>;
  const outputs: Record<string, string> = {};
  for (const key of AI_OUTPUT_KEYS[request.toolId]) {
    if (typeof source[key] !== "string" || !source[key].trim()) {
      throw new AiServiceError(`The configured AI provider omitted the required “${key}” output.`, "BAD_GATEWAY");
    }
    outputs[key] = source[key].trim();
  }
  return outputs;
}

function createPrompt(request: AiRequest) {
  const outputKeys = AI_OUTPUT_KEYS[request.toolId];
  return {
    system: "You are the server-side NEXA AI service. Return only a valid JSON object matching the exact required keys. Never add markdown fences, commentary, or extra keys.",
    user: JSON.stringify({
      toolId: request.toolId,
      source: request.source,
      shortInput: request.shortInput ?? "",
      assetReference: "No media is supplied through this text provider.",
      options: request.options,
      requiredOutputKeys: outputKeys,
    }),
    outputKeys,
  };
}

function getOpenAiCompatibleBaseUrl(baseUrl?: string) {
  return (baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL).replace(/\/$/, "");
}

function getTimeoutMs(timeoutMs?: number) {
  if (!Number.isFinite(timeoutMs) || !timeoutMs || timeoutMs <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.floor(timeoutMs);
}

function ensureProviderIsReady(config: AiProviderConfig) {
  if (config.provider?.trim().toLowerCase() !== "openai-compatible") {
    throw new AiServiceError("AI provider is not configured. Set NEXA_AI_PROVIDER=openai-compatible before sending requests.", "PRECONDITION_FAILED");
  }

  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new AiServiceError("AI provider API key is missing. Set NEXA_AI_PROVIDER_API_KEY on the server before sending requests.", "PRECONDITION_FAILED");
  }

  const model = config.model?.trim();
  if (!model) {
    throw new AiServiceError("AI provider model is missing. Set NEXA_AI_MODEL on the server before sending requests.", "PRECONDITION_FAILED");
  }

  return { apiKey, model };
}

export function createAiProvider(config: AiProviderConfig, fetchImpl: typeof fetch = fetch): AiProvider {
  return {
    async generate(request) {
      if (MEDIA_AI_TOOL_IDS.has(request.toolId)) {
        throw new AiServiceError("This tool requires the secure media-upload and asynchronous media-processing pipeline before an AI provider can receive the asset.", "NOT_IMPLEMENTED");
      }

      const readyConfig = ensureProviderIsReady(config);

      const prompt = createPrompt(request);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), getTimeoutMs(config.timeoutMs));
      let response: Response;
      try {
        response = await fetchImpl(`${getOpenAiCompatibleBaseUrl(config.baseUrl)}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${readyConfig.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: readyConfig.model,
            temperature: 0.4,
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: `nexa_${request.toolId.replace(/-/g, "_")}`,
                strict: true,
                schema: {
                  type: "object",
                  properties: Object.fromEntries(prompt.outputKeys.map((key) => [key, { type: "string" }])),
                  required: prompt.outputKeys,
                  additionalProperties: false,
                },
              },
            },
          }),
        });
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          throw new AiServiceError("The AI provider request timed out. Please try again shortly.", "BAD_GATEWAY");
        }
        throw new AiServiceError("The AI provider could not be reached. Check the server-side provider base URL and network access.", "BAD_GATEWAY");
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new AiServiceError("The AI provider rejected the request. Check the server-side credentials, selected model, and provider configuration.", "BAD_GATEWAY");
      }

      let payload: ChatCompletionPayload;
      try {
        payload = (await response.json()) as ChatCompletionPayload;
      } catch {
        throw new AiServiceError("The AI provider returned an unreadable response.", "BAD_GATEWAY");
      }
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new AiServiceError("The AI provider returned no usable completion content.", "BAD_GATEWAY");
      }

      return {
        toolId: request.toolId,
        outputs: normalizeAiOutputs(request, content),
        provider: "openai-compatible",
        model: readyConfig.model,
      };
    },
  };
}

export function getAiProvider() {
  return createAiProvider({
    provider: ENV.nexaAiProvider,
    apiKey: ENV.nexaAiProviderApiKey,
    baseUrl: ENV.nexaAiProviderBaseUrl,
    model: ENV.nexaAiModel,
  });
}
