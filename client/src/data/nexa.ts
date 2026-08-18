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

export const TOOL_REGISTRY: ToolDefinition[] = [
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
];

export const FEATURED_TOOL_IDS = [
  "ai-summarizer",
  "image-compressor",
  "quick-calculator",
  "notes",
] as const;
