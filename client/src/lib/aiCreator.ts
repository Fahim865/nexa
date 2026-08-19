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

export type AiCreatorAssetInput = {
  accept: string;
  prompt: string;
  detail: string;
};

export type AiCreatorShortInput = {
  label: string;
  placeholder: string;
  hint: string;
  required?: boolean;
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
  assetInput?: AiCreatorAssetInput;
  shortInput?: AiCreatorShortInput;
  showSourceText?: boolean;
  requiresSourceText?: boolean;
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
    assetInput: { accept: "video/*", prompt: "Choose a local video for the future API", detail: "Retained in this browser only; upload begins after an API integration exists." },
  },
  "ai-stock-metadata-generator": {
    eyebrow: "ASSET LENS",
    promise: "Make the asset discoverable.",
    detail: "Prepare the visual, motion context, and topic that a stock-metadata model needs to return marketplace-ready copy.",
    inputLabel: "VIDEO DESCRIPTION",
    inputTitle: "Describe the moving context.",
    inputPlaceholder: "Describe the scene, movement, camera perspective, visible concepts, and any people, places, or products in the accompanying video…",
    inputHint: "The future API receives your visual asset, its motion context, topic, and marketplace settings.",
    shortInput: { label: "TOPIC", placeholder: "e.g. Sustainable city transport", hint: "A required topic anchors the metadata request.", required: true },
    assetInput: { accept: "image/*", prompt: "Choose a stock image for the future API", detail: "The selected image remains local until a secured AI upload flow is connected." },
    settings: [
      { id: "marketplace", label: "MARKETPLACE", options: ["Adobe Stock", "Shutterstock", "iStock", "General stock"], defaultValue: "General stock" },
      { id: "assetType", label: "ASSET TYPE", options: ["Photography", "Illustration", "Generative artwork", "Video still"], defaultValue: "Photography" },
      { id: "keywordVolume", label: "KEYWORD VOLUME", options: ["15 essential", "30 balanced", "45 broad discovery"], defaultValue: "30 balanced" },
    ],
    outputs: [{ label: "SEO TITLE", hint: "A marketplace-ready title appears here." }, { label: "DESCRIPTION", hint: "A concise descriptive caption appears here." }, { label: "KEYWORDS", hint: "A prioritized keyword set appears here." }, { label: "CATEGORY SUGGESTION", hint: "Likely stock categories appear here." }],
    apiCapability: "Multimodal image understanding with topic, marketplace, category, and keyword controls",
    requiresSourceText: true,
  },
  "ai-youtube-seo-assistant": {
    eyebrow: "SEARCH LENS",
    promise: "Give the upload a clearer signal.",
    detail: "Set the core video topic and current description before an AI service develops stronger YouTube search metadata.",
    inputLabel: "CURRENT DESCRIPTION",
    inputTitle: "Bring in the copy.",
    inputPlaceholder: "Paste the current YouTube description, script outline, chapter cues, or key points you want to strengthen…",
    inputHint: "The future API receives your topic, existing description, and search-intent controls.",
    shortInput: { label: "VIDEO TOPIC / CURRENT TITLE", placeholder: "e.g. Beginner guide to cinematic travel videos", hint: "A required topic gives the SEO request a clear subject.", required: true },
    settings: [
      { id: "audience", label: "AUDIENCE", options: ["General viewers", "Beginners", "Creators", "Professionals", "Niche enthusiasts"], defaultValue: "General viewers" },
      { id: "intent", label: "SEARCH INTENT", options: ["Educational", "How-to", "Review", "Inspiration", "Entertainment"], defaultValue: "Educational" },
      { id: "titleStyle", label: "TITLE STYLE", options: ["Clear", "Curiosity-led", "Keyword-first", "Editorial"], defaultValue: "Clear" },
    ],
    outputs: [{ label: "SEO TITLE SUGGESTIONS", hint: "Title options appear here." }, { label: "DESCRIPTION IMPROVEMENT", hint: "An improved description appears here." }, { label: "TAGS", hint: "YouTube tag ideas appear here." }, { label: "KEYWORDS", hint: "Prioritized search keywords appear here." }],
    apiCapability: "Text generation for YouTube metadata with topical, audience, and search-intent controls",
    requiresSourceText: true,
  },
  "ai-subtitle-generator": {
    eyebrow: "VOICE LENS",
    promise: "Turn speech into structure.",
    detail: "Stage an audio or video source, language, and subtitle format for a future transcription and timed-caption connection.",
    inputLabel: "MEDIA SOURCE",
    inputTitle: "Bring in the recording.",
    inputPlaceholder: "",
    inputHint: "The future API receives the media asset and transcript preferences below.",
    assetInput: { accept: "audio/*,video/*", prompt: "Choose a local audio or video file for the future API", detail: "The media file stays in this browser. A production API will need secure upload and transcription processing." },
    settings: [
      { id: "language", label: "SPOKEN LANGUAGE", options: ["Auto-detect", "English", "Bengali", "Arabic", "Spanish", "French"], defaultValue: "Auto-detect" },
      { id: "subtitleFormat", label: "SUBTITLE FILE", options: ["SRT", "WebVTT", "Plain transcript"], defaultValue: "SRT" },
      { id: "speakerLabels", label: "SPEAKER LABELS", options: ["Off", "When confident", "Always requested"], defaultValue: "When confident" },
    ],
    outputs: [{ label: "TRANSCRIPT", hint: "A timestamped transcript appears here." }, { label: "SUBTITLE FILE PREPARATION", hint: "A downloadable subtitle preparation appears here." }, { label: "LANGUAGE + TIMING", hint: "Detected language and timing notes appear here." }],
    apiCapability: "Speech-to-text with language detection, timestamps, optional speaker labels, and subtitle-file formatting",
    showSourceText: false,
  },
};

export function getAiCreatorConfig(id: AiCreatorToolId) {
  return AI_CREATOR_CONFIG[id];
}
