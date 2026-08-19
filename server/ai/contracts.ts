import { z } from "zod";

export const aiToolIdSchema = z.enum([
  "ai-translator",
  "ai-hashtag-generator",
  "ai-description-generator",
  "ai-stock-metadata-generator",
  "ai-youtube-seo-assistant",
  "ai-subtitle-generator",
  "ai-video-analyzer",
  "ai-video-clip-planner",
]);

export type AiToolId = z.infer<typeof aiToolIdSchema>;

const sourceText = z.string().trim().max(24_000).default("");
const shortInput = z.string().trim().max(1_000).optional();
const options = z.record(z.string().trim().min(1).max(80), z.string().trim().max(180)).default({});
const assetReference = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .refine((value) => value.startsWith("/manus-storage/") || /^https:\/\//i.test(value), "Asset reference must be a secure HTTPS URL or a Manus storage path.");

export const aiRunInputSchema = z.object({
  toolId: aiToolIdSchema,
  source: sourceText,
  shortInput,
  assetRef: assetReference.optional(),
  options,
});

const textRequest = z.object({ source: z.string().trim().min(1).max(24_000), shortInput, options });
const mediaRequest = z.object({ source: sourceText, shortInput, assetRef: assetReference, options });

export const aiToolSchemas = {
  "ai-translator": textRequest.extend({ toolId: z.literal("ai-translator") }),
  "ai-hashtag-generator": textRequest.extend({ toolId: z.literal("ai-hashtag-generator") }),
  "ai-description-generator": textRequest.extend({ toolId: z.literal("ai-description-generator") }),
  "ai-stock-metadata-generator": mediaRequest.extend({
    toolId: z.literal("ai-stock-metadata-generator"),
    source: z.string().trim().min(1).max(24_000),
    shortInput: z.string().trim().min(1).max(1_000),
  }),
  "ai-youtube-seo-assistant": textRequest.extend({
    toolId: z.literal("ai-youtube-seo-assistant"),
    shortInput: z.string().trim().min(1).max(1_000),
  }),
  "ai-subtitle-generator": mediaRequest.extend({ toolId: z.literal("ai-subtitle-generator") }),
  "ai-video-analyzer": mediaRequest.extend({ toolId: z.literal("ai-video-analyzer") }),
  "ai-video-clip-planner": mediaRequest.extend({ toolId: z.literal("ai-video-clip-planner") }),
};

export type AiRequest =
  | z.infer<(typeof aiToolSchemas)["ai-translator"]>
  | z.infer<(typeof aiToolSchemas)["ai-hashtag-generator"]>
  | z.infer<(typeof aiToolSchemas)["ai-description-generator"]>
  | z.infer<(typeof aiToolSchemas)["ai-stock-metadata-generator"]>
  | z.infer<(typeof aiToolSchemas)["ai-youtube-seo-assistant"]>
  | z.infer<(typeof aiToolSchemas)["ai-subtitle-generator"]>
  | z.infer<(typeof aiToolSchemas)["ai-video-analyzer"]>
  | z.infer<(typeof aiToolSchemas)["ai-video-clip-planner"]>;

export const AI_OUTPUT_KEYS: Record<AiToolId, readonly string[]> = {
  "ai-translator": ["translation", "notes"],
  "ai-hashtag-generator": ["hashtag_set", "discovery_mix"],
  "ai-description-generator": ["description", "opening_cta"],
  "ai-stock-metadata-generator": ["seo_title", "description", "keywords", "category_suggestion"],
  "ai-youtube-seo-assistant": ["seo_title_suggestions", "description_improvement", "tags", "keywords"],
  "ai-subtitle-generator": ["transcript", "subtitle_file_preparation", "language_timing"],
  "ai-video-analyzer": ["title", "description", "hashtags"],
  "ai-video-clip-planner": ["video_summary", "best_moments_timestamps", "short_clip_ideas", "suggested_titles", "suggested_hashtags", "suggested_descriptions"],
};

export const MEDIA_AI_TOOL_IDS = new Set<AiToolId>([
  "ai-stock-metadata-generator",
  "ai-subtitle-generator",
  "ai-video-analyzer",
  "ai-video-clip-planner",
]);

export function parseAiRequest(input: unknown): AiRequest {
  const commonInput = aiRunInputSchema.parse(input);
  const schema = aiToolSchemas[commonInput.toolId];
  return schema.parse(commonInput) as AiRequest;
}
