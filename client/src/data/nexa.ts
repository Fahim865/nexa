/**
 * Orbit Studio design reminder: this registry powers the calm, catalog-like
 * NEXA discovery experience. Business-facing values live here, never inside UI.
 */
import type { LucideIcon } from "lucide-react";
import {
  Binary,
  Braces,
  Calculator,
  CaseUpper,
  Clock3,
  Code2,
  Crop,
  Eraser,
  Expand,
  FileImage,
  FileStack,
  FileText,
  FilePenLine,
  ImageIcon,
  Info,
  KeyRound,
  Languages,
  Link,
  ListTodo,
  Minimize2,
  NotebookPen,
  QrCode,
  RefreshCw,
  RotateCw,
  Sparkles,
  TextCursorInput,
  Video,
  Wand2,
  Hash,
} from "lucide-react";

export type ToolStatus = "available" | "beta" | "coming-soon";

export type ToolDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  creditCost: number;
  status: ToolStatus;
  icon: LucideIcon;
  route: string;
};

type ToolCategoryDefinition = {
  id: string;
  label: string;
  categories: readonly ToolDefinition["category"][] | "all";
};

function defineToolRegistry<const T extends readonly ToolDefinition[]>(tools: T): T {
  const ids = new Set<string>();
  const names = new Set<string>();
  const routes = new Set<string>();

  for (const tool of tools) {
    if (!tool.id || !tool.name || !tool.description || !tool.category || !tool.route) {
      throw new Error("Every NEXA tool must include an id, name, description, category, and route.");
    }

    if (!tool.route.startsWith("/")) {
      throw new Error(`NEXA tool route must begin with '/': ${tool.id}`);
    }

    if (ids.has(tool.id) || names.has(tool.name) || routes.has(tool.route)) {
      throw new Error(`NEXA tool registry has a duplicate id, name, or route: ${tool.id}`);
    }

    ids.add(tool.id);
    names.add(tool.name);
    routes.add(tool.route);
  }

  return tools;
}

export const PLAN_CONFIG = {
  free: {
    name: "NEXA Free",
    priceLabel: "$0",
    creditsLabel: "Browse all AI workflows",
    detail: "Explore every AI tool and its secure request workspace before upgrading.",
  },
  premium: {
    name: "NEXA Premium",
    priceLabel: "$10",
    cadence: "/ month",
    creditsLabel: "Secure AI execution",
    detail: "A server-verified plan for protected AI requests. Monthly credits arrive in the next release.",
  },
} as const;

export const TOOL_REGISTRY = defineToolRegistry([
  {
    id: "ai-summarizer",
    name: "AI Summarizer",
    category: "AI",
    description: "Turn long material into a clear working brief.",
    creditCost: 10,
    status: "beta",
    icon: Sparkles,
    route: "/tools/ai/summarizer",
  },
  {
    id: "ai-translator",
    name: "AI Translator",
    category: "AI Creator Tools",
    description: "Prepare a tone-aware translation request with language and audience controls.",
    creditCost: 0,
    status: "beta",
    icon: Languages,
    route: "/tools/ai/translator",
  },
  {
    id: "ai-hashtag-generator",
    name: "AI Hashtag Generator",
    category: "AI Creator Tools",
    description: "Shape a platform-specific hashtag brief before connecting an AI generation service.",
    creditCost: 0,
    status: "beta",
    icon: Hash,
    route: "/tools/ai/hashtag-generator",
  },
  {
    id: "ai-description-generator",
    name: "AI Description Generator",
    category: "AI Creator Tools",
    description: "Prepare an audience-led description request with channel, tone, and length controls.",
    creditCost: 0,
    status: "beta",
    icon: FilePenLine,
    route: "/tools/ai/description-generator",
  },
  {
    id: "ai-video-analyzer",
    name: "AI Video Analyzer",
    category: "AI Creator Tools",
    description: "Set up a video analysis request for titles, descriptions, and hashtags without simulated output.",
    creditCost: 0,
    status: "beta",
    icon: Video,
    route: "/tools/ai/video-analyzer",
  },
  {
    id: "ai-video-clip-planner",
    name: "AI Video Analyzer / Clip Planner",
    category: "AI Creator Tools",
    description: "Prepare a long-form video analysis request for timestamped short-form moments, clip concepts, and publishing metadata.",
    creditCost: 0,
    status: "beta",
    icon: Video,
    route: "/tools/ai/video-clip-planner",
  },
  {
    id: "ai-stock-metadata-generator",
    name: "AI Stock Metadata Generator",
    category: "AI Creator Tools",
    description: "Prepare a stock-marketplace image brief with visual context, topic, and structured metadata outputs.",
    creditCost: 0,
    status: "beta",
    icon: FileImage,
    route: "/tools/ai/stock-metadata-generator",
  },
  {
    id: "ai-youtube-seo-assistant",
    name: "AI YouTube SEO Assistant",
    category: "AI Creator Tools",
    description: "Prepare a YouTube topic and description brief for title, description, tag, and keyword optimization.",
    creditCost: 0,
    status: "beta",
    icon: Video,
    route: "/tools/ai/youtube-seo-assistant",
  },
  {
    id: "ai-subtitle-generator",
    name: "AI Subtitle Generator",
    category: "AI Creator Tools",
    description: "Prepare an audio or video source for transcription and subtitle-file generation without simulated output.",
    creditCost: 0,
    status: "beta",
    icon: FileText,
    route: "/tools/ai/subtitle-generator",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    category: "Image Tools",
    description: "Reduce image size locally while keeping practical visual quality.",
    creditCost: 0,
    status: "available",
    icon: Minimize2,
    route: "/tools/image-compressor",
  },
  {
    id: "image-upscaler",
    name: "AI Image Upscaler",
    category: "Image Tools",
    description: "Increase canvas resolution with local high-quality resampling and sharpening.",
    creditCost: 0,
    status: "available",
    icon: Expand,
    route: "/tools/image-upscaler",
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    category: "Image Tools",
    description: "Set exact dimensions while optionally preserving the original aspect ratio.",
    creditCost: 0,
    status: "available",
    icon: Expand,
    route: "/tools/image-resizer",
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    category: "Image Tools",
    description: "Select a precise local crop area and download the resulting image.",
    creditCost: 0,
    status: "available",
    icon: Crop,
    route: "/tools/image-cropper",
  },
  {
    id: "image-converter",
    name: "Image Converter",
    category: "Image Tools",
    description: "Convert supported JPG, PNG, WebP, GIF, and BMP images in your browser.",
    creditCost: 0,
    status: "available",
    icon: RefreshCw,
    route: "/tools/image-converter",
  },
  {
    id: "image-rotator",
    name: "Image Rotator",
    category: "Image Tools",
    description: "Rotate and flip an image locally with a transparent before-and-after preview.",
    creditCost: 0,
    status: "available",
    icon: RotateCw,
    route: "/tools/image-rotator",
  },
  {
    id: "image-metadata",
    name: "Image Metadata Viewer",
    category: "Image Tools",
    description: "Inspect file size, dimensions, rendered format, and core file information.",
    creditCost: 0,
    status: "available",
    icon: Info,
    route: "/tools/image-metadata",
  },
  {
    id: "quick-calculator",
    name: "Quick Calculator",
    category: "Calculators",
    description: "A simple calculation surface for everyday numbers.",
    creditCost: 0,
    status: "available",
    icon: Calculator,
    route: "/tools/calculators/basic",
  },
  {
    id: "notes",
    name: "Notes",
    category: "Productivity",
    description: "Hold ideas, tasks and fragments in one quiet place.",
    creditCost: 1,
    status: "available",
    icon: NotebookPen,
    route: "/tools/productivity/notes",
  },
  {
    id: "pdf-studio",
    name: "PDF Studio",
    category: "PDF & Documents",
    description: "Prepare documents for merge, split and conversion flows.",
    creditCost: 1,
    status: "coming-soon",
    icon: FileText,
    route: "/tools/pdf",
  },
  {
    id: "pdf-page-counter",
    name: "PDF Page Counter",
    category: "Documents & Utility",
    description: "Read a local PDF and count its pages without uploading the document.",
    creditCost: 0,
    status: "available",
    icon: FileStack,
    route: "/tools/pdf-page-counter",
  },
  {
    id: "markdown-previewer",
    name: "Markdown Previewer",
    category: "Documents & Utility",
    description: "Write Markdown and inspect a safe browser-local rendered preview.",
    creditCost: 0,
    status: "available",
    icon: FileText,
    route: "/tools/markdown-previewer",
  },
  {
    id: "markdown-to-html",
    name: "Markdown to HTML",
    category: "Documents & Utility",
    description: "Transform Markdown into reusable HTML output entirely in the browser.",
    creditCost: 0,
    status: "available",
    icon: Code2,
    route: "/tools/markdown-to-html",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    category: "Documents & Utility",
    description: "Validate and indent JSON with a readable structured output.",
    creditCost: 0,
    status: "available",
    icon: Braces,
    route: "/tools/json-formatter",
  },
  {
    id: "json-validator",
    name: "JSON Validator",
    category: "Documents & Utility",
    description: "Check JSON syntax locally and receive a clear validation state.",
    creditCost: 0,
    status: "available",
    icon: Braces,
    route: "/tools/json-validator",
  },
  {
    id: "json-minifier",
    name: "JSON Minifier",
    category: "Documents & Utility",
    description: "Remove unnecessary JSON whitespace while preserving valid data.",
    creditCost: 0,
    status: "available",
    icon: Minimize2,
    route: "/tools/json-minifier",
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder",
    category: "Documents & Utility",
    description: "Encode UTF-8 text as Base64 in the current browser session.",
    creditCost: 0,
    status: "available",
    icon: Binary,
    route: "/tools/base64-encoder",
  },
  {
    id: "base64-decoder",
    name: "Base64 Decoder",
    category: "Documents & Utility",
    description: "Decode valid Base64 text back to readable UTF-8 locally.",
    creditCost: 0,
    status: "available",
    icon: Binary,
    route: "/tools/base64-decoder",
  },
  {
    id: "url-encoder",
    name: "URL Encoder",
    category: "Documents & Utility",
    description: "Encode URL components safely with native browser encoding.",
    creditCost: 0,
    status: "available",
    icon: Link,
    route: "/tools/url-encoder",
  },
  {
    id: "url-decoder",
    name: "URL Decoder",
    category: "Documents & Utility",
    description: "Decode URL-encoded components with clear invalid-input feedback.",
    creditCost: 0,
    status: "available",
    icon: Link,
    route: "/tools/url-decoder",
  },
  {
    id: "qr-code-generator",
    name: "QR Code Generator",
    category: "Documents & Utility",
    description: "Generate and download a QR code from text or a web address locally.",
    creditCost: 0,
    status: "available",
    icon: QrCode,
    route: "/tools/qr-code-generator",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    category: "Documents & Utility",
    description: "Create configurable random passwords using the browser cryptography API.",
    creditCost: 0,
    status: "available",
    icon: KeyRound,
    route: "/tools/password-generator",
  },
  {
    id: "word-counter",
    name: "Word Counter",
    category: "Text",
    description: "Measure language with a clean, low-friction text utility.",
    creditCost: 0,
    status: "available",
    icon: Wand2,
    route: "/tools/text/word-counter",
  },
  {
    id: "character-counter",
    name: "Character Counter",
    category: "Text",
    description: "Count characters, spaces, and compact text length locally.",
    creditCost: 0,
    status: "available",
    icon: TextCursorInput,
    route: "/tools/text/character-counter",
  },
  {
    id: "sentence-counter",
    name: "Sentence Counter",
    category: "Text",
    description: "Estimate complete sentences from your working text locally.",
    creditCost: 0,
    status: "available",
    icon: FileText,
    route: "/tools/text/sentence-counter",
  },
  {
    id: "reading-time",
    name: "Reading Time Calculator",
    category: "Text",
    description: "Estimate reading time from a clear 200-word-per-minute baseline.",
    creditCost: 0,
    status: "available",
    icon: Clock3,
    route: "/tools/text/reading-time",
  },
  {
    id: "case-converter",
    name: "Case Converter",
    category: "Text",
    description: "Convert selected text into upper, lower, title, or sentence case.",
    creditCost: 0,
    status: "available",
    icon: CaseUpper,
    route: "/tools/text/case-converter",
  },
  {
    id: "text-cleaner",
    name: "Text Cleaner",
    category: "Text",
    description: "Remove surplus spacing and normalize paragraph breaks in the browser.",
    creditCost: 0,
    status: "available",
    icon: Eraser,
    route: "/tools/text/cleaner",
  },
  {
    id: "file-converter",
    name: "File Converter",
    category: "Files",
    description: "A prepared surface for practical file transformations.",
    creditCost: 1,
    status: "coming-soon",
    icon: FileImage,
    route: "/tools/files/converter",
  },
  {
    id: "daily-planner",
    name: "Daily Planner",
    category: "Productivity",
    description: "Arrange a focused day around the work that matters.",
    creditCost: 1,
    status: "available",
    icon: ListTodo,
    route: "/tools/productivity/planner",
  },
] as const);

export type ToolId = (typeof TOOL_REGISTRY)[number]["id"];

export const LOCAL_TOOL_IDS = [
  "quick-calculator",
  "word-counter",
  "character-counter",
  "sentence-counter",
  "reading-time",
  "case-converter",
  "text-cleaner",
] as const;

export type LocalToolId = (typeof LOCAL_TOOL_IDS)[number];

export function isLocalToolId(id: string): id is LocalToolId {
  return (LOCAL_TOOL_IDS as readonly string[]).includes(id);
}

export const IMAGE_TOOL_IDS = [
  "image-upscaler",
  "image-compressor",
  "image-resizer",
  "image-cropper",
  "image-converter",
  "image-rotator",
  "image-metadata",
] as const;

export type ImageToolId = (typeof IMAGE_TOOL_IDS)[number];

export function isImageToolId(id: string): id is ImageToolId {
  return (IMAGE_TOOL_IDS as readonly string[]).includes(id);
}

export const AI_CREATOR_TOOL_IDS = [
  "ai-translator",
  "ai-hashtag-generator",
  "ai-description-generator",
  "ai-video-analyzer",
  "ai-video-clip-planner",
  "ai-stock-metadata-generator",
  "ai-youtube-seo-assistant",
  "ai-subtitle-generator",
] as const;

export type AiCreatorToolId = (typeof AI_CREATOR_TOOL_IDS)[number];

export function isAiCreatorToolId(id: string): id is AiCreatorToolId {
  return (AI_CREATOR_TOOL_IDS as readonly string[]).includes(id);
}

export const DOCUMENT_UTILITY_TOOL_IDS = [
  "pdf-page-counter",
  "markdown-previewer",
  "markdown-to-html",
  "json-formatter",
  "json-validator",
  "json-minifier",
  "base64-encoder",
  "base64-decoder",
  "url-encoder",
  "url-decoder",
  "qr-code-generator",
  "password-generator",
] as const;

export type DocumentUtilityToolId = (typeof DOCUMENT_UTILITY_TOOL_IDS)[number];

export function isDocumentUtilityToolId(id: string): id is DocumentUtilityToolId {
  return (DOCUMENT_UTILITY_TOOL_IDS as readonly string[]).includes(id);
}

export const TOOL_CATEGORIES = [
  { id: "all", label: "All tools", categories: "all" },
  { id: "ai-creator", label: "AI Creator Tools", categories: ["AI Creator Tools"] },
  { id: "ai-writing", label: "AI & writing", categories: ["AI", "Text"] },
  { id: "image-tools", label: "Image tools", categories: ["Image Tools"] },
  { id: "documents-utility", label: "Documents & utility", categories: ["Documents & Utility", "Files", "PDF & Documents"] },
  { id: "numbers", label: "Numbers", categories: ["Calculators"] },
  { id: "workspace", label: "Personal workspace", categories: ["Productivity"] },
] as const satisfies readonly ToolCategoryDefinition[];

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[number]["id"];

export function getToolById(id: ToolId | string) {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getToolByRoute(route: string) {
  return TOOL_REGISTRY.find((tool) => tool.route === route);
}

export function getToolsForCategory(categoryId: ToolCategoryId) {
  const category: ToolCategoryDefinition = TOOL_CATEGORIES.find((item) => item.id === categoryId) ?? TOOL_CATEGORIES[0];

  if (category.categories === "all") {
    return TOOL_REGISTRY;
  }

  return TOOL_REGISTRY.filter((tool) => category.categories.includes(tool.category));
}

export function searchToolRegistry(query: string, categoryId: ToolCategoryId = "all") {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const sourceTools = getToolsForCategory(categoryId);

  if (!normalizedQuery) {
    return sourceTools;
  }

  return sourceTools.filter((tool) =>
    [tool.id, tool.name, tool.description, tool.category, tool.route]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );
}

export const FEATURED_TOOL_IDS = [
  "ai-summarizer",
  "image-compressor",
  "quick-calculator",
  "notes",
] as const;
