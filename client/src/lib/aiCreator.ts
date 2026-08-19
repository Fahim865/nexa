/**
 * Orbit Studio design reminder: API contracts remain explicit and human-legible.
 * These objects model only client-side request preparation, never AI output.
 */
import type { AiCreatorToolId } from "@/data/nexa";

export type AiCreatorSetting = {
  id: string;
  label: string;
  options: readonly string[];
  defaultValue: string;
};

export type AiCreatorOutputSlot = {
  label: string;
  hint: string;
};

export type AiCreatorToolConfig = {
  eyebrow: string;
  promise: string;
  detail: string;
  inputLabel: string;
  inputTitle: string;
  inputPlaceholder: string;
  inputHint: string;
  settings: readonly AiCreatorSetting[];
  outputs: readonly AiCreatorOutputSlot[];
  apiCapability: string;
  supportsVideoSource?: boolean;
};

export const AI_CREATOR_CONFIG: Record<AiCreatorToolId, AiCreatorToolConfig> = {
  "ai-translator": {
    eyebrow: "LANGUAGE LENS",
    promise: "Carry the intent across.",
    detail: "Prepare a translation with source, destination, and tone decisions kept visible before the model runs.",
    inputLabel: "SOURCE TEXT",
    inputTitle: "Bring in the original.",
    inputPlaceholder: "Paste the text you want to translate…",
    inputHint: "The future API receives this text and the language controls below.",
    settings: [
      { id: "sourceLanguage", label: "SOURCE LANGUAGE", options: ["Auto-detect", "English", "Bengali", "Arabic", "Spanish", "French"], defaultValue: "Auto-detect" },
      { id: "targetLanguage", label: "TARGET LANGUAGE", options: ["English", "Bengali", "Arabic", "Spanish", "French", "Japanese"], defaultValue: "English" },
      { id: "tone", label: "VOICE", options: ["Faithful", "Natural", "Formal", "Conversational"], defaultValue: "Natural" },
    ],
    outputs: [{ label: "TRANSLATION", hint: "Model-generated translation appears here." }, { label: "NOTES", hint: "Ambiguities and alternative phrasing appear here." }],
    apiCapability: "Text generation with language-direction and tone controls",
  },
  "ai-hashtag-generator": {
    eyebrow: "DISCOVERY LENS",
    promise: "Find the right signal.",
    detail: "Define a campaign brief and platform intent first; the AI connection can then return relevant, non-duplicated hashtags.",
    inputLabel: "CONTENT BRIEF",
    inputTitle: "Describe the post.",
    inputPlaceholder: "What is the post, product, video, or campaign about? Add key terms, location, and any excluded tags…",
    inputHint: "The future API receives your brief, platform, audience, and requested volume.",
    settings: [
      { id: "platform", label: "PLATFORM", options: ["Instagram", "TikTok", "YouTube", "LinkedIn", "X"], defaultValue: "Instagram" },
      { id: "audience", label: "AUDIENCE", options: ["General", "Local", "Professional", "Creator", "Niche community"], defaultValue: "General" },
      { id: "volume", label: "TAG VOLUME", options: ["8 focused tags", "15 balanced tags", "25 discovery tags"], defaultValue: "15 balanced tags" },
    ],
    outputs: [{ label: "HASHTAG SET", hint: "A curated tag set appears here." }, { label: "DISCOVERY MIX", hint: "Broad, niche, and branded balance appears here." }],
    apiCapability: "Text generation with platform, audience, and tag-volume controls",
  },
  "ai-description-generator": {
    eyebrow: "EDITORIAL LENS",
    promise: "Give the idea its voice.",
    detail: "Compose the brief, audience, channel, and length in one place before an AI service writes the final description.",
    inputLabel: "CONTENT BRIEF",
    inputTitle: "Set the context.",
    inputPlaceholder: "Describe the item, scene, video, or message. Include the audience, key facts, and the action you want readers to take…",
    inputHint: "The future API receives this brief and the writing constraints below.",
    settings: [
      { id: "channel", label: "CHANNEL", options: ["Product page", "YouTube", "Instagram", "LinkedIn", "Portfolio"], defaultValue: "Product page" },
      { id: "tone", label: "TONE", options: ["Clear", "Confident", "Warm", "Editorial", "Playful"], defaultValue: "Clear" },
      { id: "length", label: "LENGTH", options: ["Short / 1–2 lines", "Medium / 1 paragraph", "Detailed / 2–3 paragraphs"], defaultValue: "Medium / 1 paragraph" },
    ],
    outputs: [{ label: "DESCRIPTION", hint: "A model-written description appears here." }, { label: "OPENING + CTA", hint: "Optional hook and call-to-action appear here." }],
    apiCapability: "Text generation with channel, tone, and length controls",
  },
  "ai-video-analyzer": {
    eyebrow: "MOTION LENS",
    promise: "Frame the story before it ships.",
    detail: "Prepare a source and publishing context for multimodal analysis that can return a title, description, and hashtags.",
    inputLabel: "VIDEO CONTEXT",
    inputTitle: "Attach the source signal.",
    inputPlaceholder: "Paste a public video URL, or write a concise summary of the video, its subject, and the audience you want to reach…",
    inputHint: "A real connection will require a video file or an accessible URL, plus the context below.",
    settings: [
      { id: "destination", label: "PUBLISHING DESTINATION", options: ["YouTube", "TikTok", "Instagram Reels", "LinkedIn", "General"], defaultValue: "YouTube" },
      { id: "voice", label: "VOICE", options: ["Clear", "Cinematic", "Educational", "Energetic", "Professional"], defaultValue: "Clear" },
      { id: "focus", label: "OUTPUT FOCUS", options: ["Title + description + hashtags", "Title variants", "Description + hashtags"], defaultValue: "Title + description + hashtags" },
    ],
    outputs: [{ label: "TITLE", hint: "Video-aware title options appear here." }, { label: "DESCRIPTION", hint: "A video-aware description appears here." }, { label: "HASHTAGS", hint: "Relevant platform hashtags appear here." }],
    apiCapability: "Multimodal video understanding with title, description, and hashtag generation",
    supportsVideoSource: true,
  },
};

export function getAiCreatorConfig(id: AiCreatorToolId) {
  return AI_CREATOR_CONFIG[id];
}
