/**
 * Orbit Studio design reminder: this registry powers the calm, catalog-like
 * NEXA discovery experience. Business-facing values live here, never inside UI.
 */
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  FileImage,
  FileText,
  ImageIcon,
  ListTodo,
  NotebookPen,
  Sparkles,
  Wand2,
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
    creditsLabel: "100 credits / day",
    detail: "A daily workspace allowance for useful, repeatable tasks.",
  },
  pro: {
    name: "NEXA Pro",
    priceLabel: "$15",
    cadence: "/ month",
    creditsLabel: "15,000 credits / billing cycle",
    detail: "More capacity for deeper work—without pretending usage is unlimited.",
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
    id: "image-compressor",
    name: "Image Compressor",
    category: "Image",
    description: "Make heavy visuals lighter without leaving the workspace.",
    creditCost: 1,
    status: "coming-soon",
    icon: ImageIcon,
    route: "/tools/image/compressor",
  },
  {
    id: "quick-calculator",
    name: "Quick Calculator",
    category: "Calculators",
    description: "A simple calculation surface for everyday numbers.",
    creditCost: 1,
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
    id: "word-counter",
    name: "Word Counter",
    category: "Text",
    description: "Measure language with a clean, low-friction text utility.",
    creditCost: 1,
    status: "available",
    icon: Wand2,
    route: "/tools/text/word-counter",
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

export const TOOL_CATEGORIES = [
  { id: "all", label: "All tools", categories: "all" },
  { id: "ai-writing", label: "AI & writing", categories: ["AI", "Text"] },
  { id: "images-files", label: "Images & files", categories: ["Image", "Files", "PDF & Documents"] },
  { id: "numbers", label: "Numbers", categories: ["Calculators"] },
  { id: "workspace", label: "Personal workspace", categories: ["Productivity"] },
] as const satisfies readonly ToolCategoryDefinition[];

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[number]["id"];

export function getToolById(id: ToolId | string) {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
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
