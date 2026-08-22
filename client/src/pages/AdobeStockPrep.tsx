/**
 * Local-only Adobe Stock technical preparation. This workspace intentionally
 * reports measurable technical checks, never a prediction of marketplace approval.
 */
import { NexaMark } from "@/components/NexaMark";
import { useAuth } from "@/_core/hooks/useAuth";
import type { ToolDefinition } from "@/data/nexa";
import { assertCanvasSize, encodeCanvas, formatLabel, loadLocalImage, readableBytes, sharpenCanvas, type SourceImage } from "@/lib/imageProcessing";
import { trpc } from "@/lib/trpc";
import JSZip from "jszip";
import { ArrowLeft, Check, Crown, Download, FileDown, ImagePlus, LoaderCircle, ShieldAlert, Sparkles, Trash2, Upload, WandSparkles, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MAX_BATCH_FILES = 20;
const MAX_FILE_BYTES = 45 * 1024 * 1024;
const MIN_PIXELS = 4_000_000;
const TARGET_PIXELS = 4_300_000;

type QualityFlag = "ok" | "review" | "warning";
type TechnicalAnalysis = { sharpness: string; sharpnessFlag: QualityFlag; noise: string; noiseFlag: QualityFlag };
type StockMetadata = { visualBrief: string; title: string; description: string; keywords: string; category: string };
type BatchItem = {
  id: string;
  source: SourceImage;
  state: "pending" | "processing" | "done" | "error";
  metadata: StockMetadata;
  error?: string;
  result?: { blob: Blob; url: string; width: number; height: number; size: number; score: number; analysis: TechnicalAnalysis };
};
type GuidelineCheck = { label: string; detail: string; status: QualityFlag };

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizedFileName(name: string) {
  return `${name.replace(/\.[^/.]+$/, "")}-adobe-stock.jpg`;
}

function validateStockFile(file: File) {
  if (!file.type.startsWith("image/")) return "This file is not a browser-readable image.";
  if (file.size > MAX_FILE_BYTES) return "Use images below 45 MB for reliable local processing.";
  return null;
}

function drawProgressively(source: SourceImage, targetWidth: number, targetHeight: number) {
  assertCanvasSize(targetWidth, targetHeight);
  let width = source.width;
  let height = source.height;
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const firstContext = canvas.getContext("2d");
  if (!firstContext) throw new Error("Canvas rendering is unavailable in this browser.");
  firstContext.drawImage(source.image, 0, 0, width, height);

  while (width < targetWidth || height < targetHeight) {
    const nextWidth = Math.min(targetWidth, Math.max(width + 1, Math.round(width * 1.6)));
    const nextHeight = Math.min(targetHeight, Math.max(height + 1, Math.round(height * 1.6)));
    assertCanvasSize(nextWidth, nextHeight);
    const next = document.createElement("canvas");
    next.width = nextWidth;
    next.height = nextHeight;
    const context = next.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(canvas, 0, 0, nextWidth, nextHeight);
    canvas = next;
    width = nextWidth;
    height = nextHeight;
  }
  return canvas;
}

function assessTechnicalQuality(canvas: HTMLCanvasElement): TechnicalAnalysis {
  const maximumSide = 360;
  const scale = Math.min(1, maximumSide / Math.max(canvas.width, canvas.height));
  const width = Math.max(2, Math.round(canvas.width * scale));
  const height = Math.max(2, Math.round(canvas.height * scale));
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const context = sample.getContext("2d");
  if (!context) throw new Error("Quality analysis could not start.");
  context.drawImage(canvas, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const luminance = new Float32Array(width * height);
  for (let index = 0; index < luminance.length; index += 1) {
    luminance[index] = 0.299 * pixels[index * 4] + 0.587 * pixels[index * 4 + 1] + 0.114 * pixels[index * 4 + 2];
  }
  let sum = 0;
  let squaredSum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian = -4 * luminance[index] + luminance[index - 1] + luminance[index + 1] + luminance[index - width] + luminance[index + width];
      sum += laplacian;
      squaredSum += laplacian * laplacian;
      count += 1;
    }
  }
  const variance = count ? squaredSum / count - (sum / count) ** 2 : 0;
  const sharpness = variance > 180 ? { value: "Sharp", flag: "ok" as const } : variance > 70 ? { value: "Moderate", flag: "review" as const } : { value: "Soft / inspect", flag: "warning" as const };

  const blockValues: number[] = [];
  for (let y = 0; y + 8 < height; y += 8) {
    for (let x = 0; x + 8 < width; x += 8) {
      let blockSum = 0;
      let blockSquareSum = 0;
      for (let blockY = y; blockY < y + 8; blockY += 1) {
        for (let blockX = x; blockX < x + 8; blockX += 1) {
          const value = luminance[blockY * width + blockX];
          blockSum += value;
          blockSquareSum += value * value;
        }
      }
      blockValues.push(Math.sqrt(Math.max(0, blockSquareSum / 64 - (blockSum / 64) ** 2)));
    }
  }
  blockValues.sort((first, second) => first - second);
  const noiseFloor = blockValues[Math.floor(blockValues.length * 0.1)] ?? 0;
  const noise = noiseFloor < 3 ? { value: "Clean", flag: "ok" as const } : noiseFloor < 8 ? { value: "Some noise", flag: "review" as const } : { value: "Noisy / inspect", flag: "warning" as const };
  return { sharpness: sharpness.value, sharpnessFlag: sharpness.flag, noise: noise.value, noiseFlag: noise.flag };
}

async function encodeWithinStockLimit(canvas: HTMLCanvasElement) {
  for (const quality of [0.92, 0.82, 0.72, 0.62, 0.52, 0.42]) {
    const blob = await encodeCanvas(canvas, "image/jpeg", quality);
    if (blob.size <= MAX_FILE_BYTES || quality === 0.42) return blob;
  }
  throw new Error("The browser could not encode this image within the 45 MB size limit.");
}

async function prepareItem(item: BatchItem) {
  const pixels = item.source.width * item.source.height;
  const scale = pixels < MIN_PIXELS ? Math.sqrt(TARGET_PIXELS / pixels) : 1;
  const targetWidth = Math.round(item.source.width * scale);
  const targetHeight = Math.round(item.source.height * scale);
  const canvas = drawProgressively(item.source, targetWidth, targetHeight);
  if (scale > 1) sharpenCanvas(canvas, 0.12);
  const analysis = assessTechnicalQuality(canvas);
  const blob = await encodeWithinStockLimit(canvas);
  const score = 3 + Number(analysis.sharpnessFlag === "ok") + Number(analysis.noiseFlag === "ok");
  return { blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, size: blob.size, score, analysis };
}

function statusStyle(flag: QualityFlag) {
  return flag === "ok" ? "text-emerald-300" : flag === "review" ? "text-amber-200" : "text-rose-300";
}

function createMetadata(): StockMetadata {
  return { visualBrief: "", title: "", description: "", keywords: "", category: "" };
}

function csvField(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function getSubmissionChecks(item: BatchItem): GuidelineCheck[] {
  const result = item.result;
  const width = result?.width ?? item.source.width;
  const height = result?.height ?? item.source.height;
  const bytes = result?.size ?? item.source.file.size;
  const formatIsJpeg = Boolean(result) || item.source.file.type === "image/jpeg";
  const checks: GuidelineCheck[] = [
    { label: "JPEG output", detail: formatIsJpeg ? "JPEG is prepared for export." : "Process this asset to create a JPEG export.", status: formatIsJpeg ? "ok" : "review" },
    { label: "Minimum resolution", detail: `${((width * height) / 1_000_000).toFixed(1)} MP measured; this workspace targets at least 4 MP.`, status: width * height >= MIN_PIXELS ? "ok" : "warning" },
    { label: "Output file size", detail: `${readableBytes(bytes)} measured; local export must remain below 45 MB.`, status: bytes <= MAX_FILE_BYTES ? "ok" : "warning" },
    { label: "Metadata draft", detail: item.metadata.title.trim() && item.metadata.description.trim() && item.metadata.keywords.trim() ? "Title, description and keywords are populated." : "Add a title, description and keywords before CSV export.", status: item.metadata.title.trim() && item.metadata.description.trim() && item.metadata.keywords.trim() ? "ok" : "review" },
  ];
  if (result) {
    checks.push({ label: "Sharpness estimate", detail: result.analysis.sharpness, status: result.analysis.sharpnessFlag });
    checks.push({ label: "Noise estimate", detail: result.analysis.noise, status: result.analysis.noiseFlag });
  } else {
    checks.push({ label: "Technical analysis", detail: "Process this asset to calculate browser-local sharpness and noise estimates.", status: "review" });
  }
  return checks;
}

function MetadataEditor({ item, onChange, onAssist, assistDisabled, assistLabel }: { item: BatchItem; onChange: (patch: Partial<StockMetadata>) => void; onAssist: () => void; assistDisabled: boolean; assistLabel: string }) {
  return <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
    <div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[0.12em] text-cyan-200">STOCK METADATA</p><h3 className="truncate text-sm font-semibold text-white" title={item.source.file.name}>{item.source.file.name}</h3></div><span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] text-slate-300">LOCAL DRAFT</span></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-slate-300 sm:col-span-2"><span>Subject / visual brief <em className="not-italic text-slate-500">for AI assist</em></span><textarea value={item.metadata.visualBrief} onChange={(event) => onChange({ visualBrief: event.target.value })} className="min-h-20 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300" placeholder="Describe the subject, setting, mood and commercially relevant details." /></label><label className="space-y-1 text-xs text-slate-300"><span>Title</span><input value={item.metadata.title} onChange={(event) => onChange({ title: event.target.value })} className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300" placeholder="Descriptive, specific title" /></label><label className="space-y-1 text-xs text-slate-300"><span>Category</span><select value={item.metadata.category} onChange={(event) => onChange({ category: event.target.value })} className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"><option value="">Choose category</option>{["Animals", "Architecture", "Business", "Food", "Landscape", "Lifestyle", "Nature", "People", "Technology", "Travel"].map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label className="space-y-1 text-xs text-slate-300 sm:col-span-2"><span>Description</span><textarea value={item.metadata.description} onChange={(event) => onChange({ description: event.target.value })} className="min-h-20 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300" placeholder="Clear, accurate image description" /></label><label className="space-y-1 text-xs text-slate-300 sm:col-span-2"><span>Keywords <em className="not-italic text-slate-500">comma separated</em></span><textarea value={item.metadata.keywords} onChange={(event) => onChange({ keywords: event.target.value })} className="min-h-20 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300" placeholder="e.g. mountain, sunrise, hiking, landscape" /></label></div>
    <div className="mt-3 flex flex-wrap items-center gap-2"><button className="secondary-button" onClick={onAssist} disabled={assistDisabled}><WandSparkles size={15} /> {assistLabel}</button><span className="text-xs text-slate-500">AI suggestions overwrite only populated output fields; review every claim before export.</span></div>
  </article>;
}

export default function AdobeStockPrep({ tool }: { tool: ToolDefinition }) {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const trpcUtils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<BatchItem[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Add up to 20 images to begin.");
  const [priorityFirst, setPriorityFirst] = useState(false);
  const [assistingItemId, setAssistingItemId] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");
  const subscriptionIsCurrent = !user?.subscriptionEndDate || new Date(user.subscriptionEndDate).getTime() > Date.now();
  const hasPremiumAccess = user?.plan === "PREMIUM" && (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "TRIALING") && subscriptionIsCurrent;
  const catalog = trpc.subscription.catalog.useQuery();
  const creditStatus = trpc.subscription.creditStatus.useQuery(undefined, { enabled: hasPremiumAccess });
  const stockMetadataCost = catalog.data?.toolCreditCosts["ai-stock-metadata-generator"] ?? 3;
  const hasEnoughCredits = Boolean(creditStatus.data && creditStatus.data.remainingCredits >= stockMetadataCost);
  const runAi = trpc.ai.run.useMutation({
    onSuccess: (result) => {
      if (!assistingItemId) return;
      setItems((current) => current.map((item) => item.id === assistingItemId ? { ...item, metadata: { ...item.metadata, title: result.outputs.seo_title || item.metadata.title, description: result.outputs.description || item.metadata.description, keywords: result.outputs.keywords || item.metadata.keywords, category: result.outputs.category_suggestion || item.metadata.category } } : item));
      setAssistingItemId(null);
      setAiError("");
      void trpcUtils.subscription.creditStatus.invalidate();
      toast.success("Server-verified AI metadata suggestions are ready to review.");
    },
    onError: (error) => {
      setAssistingItemId(null);
      setAiError(error.message);
      toast.error(error.message);
    },
  });

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => itemsRef.current.forEach((item) => {
    URL.revokeObjectURL(item.source.url);
    if (item.result) URL.revokeObjectURL(item.result.url);
  }), []);

  const preparedItems = useMemo(() => items.filter((item) => item.state === "done" && item.result), [items]);
  const displayItems = useMemo(() => priorityFirst ? [...items].sort((first, second) => (first.result?.score ?? -1) - (second.result?.score ?? -1)) : items, [items, priorityFirst]);

  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const slots = MAX_BATCH_FILES - items.length;
    if (slots <= 0) {
      toast.error(`You can prepare up to ${MAX_BATCH_FILES} images at once.`);
      return;
    }
    const accepted = files.slice(0, slots);
    const skipped = files.length - accepted.length;
    const nextItems: BatchItem[] = [];
    for (const file of accepted) {
      const error = validateStockFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      try {
        const source = await loadLocalImage(file);
        nextItems.push({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, source, state: "pending", metadata: createMetadata() });
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "Image could not be read."}`);
      }
    }
    if (nextItems.length) {
      setItems((current) => [...current, ...nextItems]);
      setStatus(`${nextItems.length} image${nextItems.length === 1 ? "" : "s"} added. Files stay in this browser.`);
    }
    if (skipped > 0) toast.message(`${skipped} image${skipped === 1 ? " was" : "s were"} not added because the 20-image limit was reached.`);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
  };

  const removeItem = (id: string) => setItems((current) => current.filter((item) => {
    if (item.id !== id) return true;
    URL.revokeObjectURL(item.source.url);
    if (item.result) URL.revokeObjectURL(item.result.url);
    return false;
  }));

  const updateMetadata = (id: string, patch: Partial<StockMetadata>) => setItems((current) => current.map((item) => item.id === id ? { ...item, metadata: { ...item.metadata, ...patch } } : item));

  const requestAiAssist = (item: BatchItem) => {
    if (!user) {
      setAiError("Sign in and upgrade to Premium to request AI metadata suggestions.");
      toast.error("Sign in and upgrade to Premium to use AI assist.");
      return;
    }
    if (!hasPremiumAccess) {
      setAiError("Premium subscription required. AI metadata assist is verified on the server.");
      toast.error("Premium subscription required for AI metadata assist.");
      return;
    }
    if (creditStatus.isLoading || !hasEnoughCredits) {
      setAiError("Insufficient verified AI credits for metadata assist.");
      toast.error("Your available AI credit balance is insufficient.");
      return;
    }
    const visualBrief = item.metadata.visualBrief.trim();
    if (!visualBrief) {
      setAiError("Add a subject / visual brief before requesting AI suggestions.");
      toast.error("A visual brief is required before AI can suggest metadata.");
      return;
    }
    setAssistingItemId(item.id);
    setAiError("");
    runAi.mutate({
      toolId: "ai-stock-metadata-generator",
      source: `Filename: ${item.source.file.name}\nVisual brief: ${visualBrief}\nExisting title: ${item.metadata.title || "None"}\nExisting description: ${item.metadata.description || "None"}\nExisting keywords: ${item.metadata.keywords || "None"}`,
      shortInput: "Create accurate Adobe Stock-ready title, description, keywords and category. Do not invent unobservable details, ownership, releases, brands or compliance claims.",
      options: { marketplace: "Adobe Stock", asset_type: "Photo or illustration", keyword_volume: "25 to 40", language: "English" },
    });
  };

  const clearAll = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.source.url);
      if (item.result) URL.revokeObjectURL(item.result.url);
    });
    setItems([]);
    setProgress(0);
    setStatus("Add up to 20 images to begin.");
  };

  const processAll = async () => {
    if (!items.length || processing) return;
    setProcessing(true);
    setProgress(0);
    const activeItems = [...items];
    for (let index = 0; index < activeItems.length; index += 1) {
      const active = activeItems[index];
      setItems((current) => current.map((item) => item.id === active.id ? { ...item, state: "processing", error: undefined } : item));
      setStatus(`Preparing ${index + 1}/${activeItems.length}: ${active.source.file.name}`);
      await new Promise((resolve) => window.setTimeout(resolve, 10));
      try {
        const result = await prepareItem(active);
        setItems((current) => current.map((item) => item.id === active.id ? { ...item, state: "done", result } : item));
      } catch (error) {
        setItems((current) => current.map((item) => item.id === active.id ? { ...item, state: "error", error: error instanceof Error ? error.message : "Preparation failed." } : item));
      }
      setProgress(Math.round(((index + 1) / activeItems.length) * 100));
    }
    setProcessing(false);
    setStatus("Technical preparation finished. Review images at 100–200% before submitting them to any marketplace.");
  };

  const downloadZip = async () => {
    if (!preparedItems.length) return;
    setStatus("Creating your ZIP locally…");
    try {
      const zip = new JSZip();
      preparedItems.forEach((item) => zip.file(normalizedFileName(item.source.file.name), item.result!.blob));
      downloadBlob(await zip.generateAsync({ type: "blob" }), "nexa-adobe-stock-ready.zip");
      setStatus(`ZIP download started with ${preparedItems.length} prepared image${preparedItems.length === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ZIP creation could not complete.");
      setStatus("ZIP creation failed. Your prepared images remain available individually.");
    }
  };

  const downloadCsv = () => {
    if (!preparedItems.length) return;
    const header = "Filename,Title,Description,Keywords,Category,Resolution (MP),File size,Technical readiness,Sharpness estimate,Noise estimate\n";
    const rows = preparedItems.map((item) => {
      const result = item.result!;
      return [csvField(item.source.file.name), csvField(item.metadata.title), csvField(item.metadata.description), csvField(item.metadata.keywords), csvField(item.metadata.category), ((result.width * result.height) / 1_000_000).toFixed(1), csvField(readableBytes(result.size)), `${result.score}/5`, csvField(result.analysis.sharpness), csvField(result.analysis.noise)].join(",");
    });
    downloadBlob(new Blob([header, rows.join("\n")], { type: "text/csv;charset=utf-8" }), "nexa-adobe-stock-metadata.csv");
    setStatus("Adobe Stock metadata CSV download started.");
  };

  const downloadTechnicalReport = () => {
    if (!items.length) return;
    const header = "Filename,Check,Status,Measured guidance\n";
    const rows = items.flatMap((item) => getSubmissionChecks(item).map((check) => [csvField(item.source.file.name), csvField(check.label), check.status, csvField(check.detail)].join(",")));
    downloadBlob(new Blob([header, rows.join("\n")], { type: "text/csv;charset=utf-8" }), "nexa-adobe-stock-technical-report.csv");
    setStatus("Technical guideline report download started. This report is not an approval decision.");
  };

  const readyCount = preparedItems.filter((item) => item.result?.score === 5).length;
  const Icon = tool.icon;
  return <div className="tool-route-page local-tool-page image-tool-page">
    <header className="nexa-nav tool-route-nav">
      <a href="/" aria-label="Return to NEXA home"><NexaMark /></a>
      <a className="secondary-button tool-route-home" href="/#tool-index"><ArrowLeft size={16} /> Tool index</a>
    </header>
    <main className="local-tool-main image-tool-main">
      <section className="local-tool-hero image-tool-hero">
        <div>
          <p className="section-index"><span /> IMAGE TOOLS / LOCAL BATCH PREP</p>
          <div className="tool-route-icon"><Icon size={28} /></div>
          <h1>Adobe Stock Prep.<br /><em>technical readiness, locally.</em></h1>
          <p>Convert a batch to JPEG, meet a measured resolution threshold, strip browser-visible metadata, and export a technical report—without uploading your images.</p>
        </div>
        <div className="image-tool-orbit" aria-hidden="true"><i /><i /><i /><b><Sparkles size={17} /></b></div>
      </section>
      <section className="local-tool-workspace image-tool-workspace">
        <div className="local-tool-meta"><span>FREE / BROWSER-LOCAL BATCH TOOL</span><button onClick={() => setLocation("/#tool-index")}><ArrowLeft size={15} /> All tools</button></div>
        <div className="grid gap-3 border-y border-white/10 py-4 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-5">
          {["JPEG output", "sRGB browser canvas", "Minimum 4 MP", "45 MB output cap", "Metadata is stripped"].map((label) => <span key={label} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center">{label}</span>)}
        </div>
        <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/85"><strong className="text-amber-100">Technical check only.</strong> The readiness score measures file format, resolution, size and basic sharpness/noise heuristics. It is not an approval prediction. You must still inspect distortion, watermarks, releases, intellectual-property rights and composition.</div>
        <section className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="mt-0.5 rounded-md border border-cyan-200/30 bg-cyan-300/10 p-2 text-cyan-100"><Crown size={17} /></span><div><p className="font-mono text-[10px] tracking-[0.14em] text-cyan-100">PREMIUM AI METADATA ASSIST</p><h2 className="mt-1 text-sm font-semibold text-white">Suggestions are server-verified and cost {stockMetadataCost} credits per request.</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">Add an accurate visual brief, then review every title, keyword and category before exporting. AI does not certify content, releases or marketplace acceptance.</p></div></div>{authLoading ? <span className="font-mono text-xs text-slate-400">Checking account…</span> : hasPremiumAccess ? <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 font-mono text-xs text-emerald-200">{creditStatus.data ? `${creditStatus.data.remainingCredits} verified credits` : "Checking credits…"}</span> : <a className="primary-button" href="/premium"><Crown size={15} /> Upgrade to Premium</a>}</div>{aiError ? <p className="mt-3 rounded-md border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">{aiError}</p> : null}</section>
        <input ref={inputRef} className="image-file-input" type="file" accept="image/*" multiple onChange={onInputChange} />
        <button className={`image-dropzone mt-5 w-full ${dragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop} disabled={processing}>
          <Upload size={24} /><strong>Drop images here or choose files</strong><span>Up to 20 browser-readable images · 45 MB per source file · no upload</span>
        </button>
        {items.length ? <div className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-xs text-slate-300"><b className="text-cyan-200">{items.length}</b> / {MAX_BATCH_FILES} images selected</p><div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={() => inputRef.current?.click()} disabled={processing}><ImagePlus size={15} /> Add images</button><button className="secondary-button" onClick={clearAll} disabled={processing}><Trash2 size={15} /> Clear</button></div></div>
          {preparedItems.length ? <><div className="mb-4 flex flex-wrap gap-2"><span className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-200">Processed: {preparedItems.length}</span><span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 font-mono text-xs text-emerald-200">5/5 technical: {readyCount}</span><span className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 font-mono text-xs text-amber-100">Review: {preparedItems.length - readyCount}</span></div><button className="mb-4 rounded-md border border-white/15 px-3 py-2 font-mono text-xs text-slate-300 transition hover:border-cyan-200 hover:text-cyan-100" onClick={() => setPriorityFirst((current) => !current)}>{priorityFirst ? "Showing review priority" : "Sort: needs review first"}</button></> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{displayItems.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
            <div className="relative flex h-40 items-center justify-center bg-black/20 p-3"><img src={item.result?.url ?? item.source.url} alt={item.source.file.name} className="max-h-full max-w-full object-contain" /><button className="absolute left-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-rose-500" onClick={() => removeItem(item.id)} disabled={processing} aria-label={`Remove ${item.source.file.name}`}><X size={14} /></button><span className={`absolute right-2 top-2 rounded-full border px-2 py-1 font-mono text-[10px] ${item.state === "done" ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200" : item.state === "processing" ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : item.state === "error" ? "border-rose-300/40 bg-rose-300/10 text-rose-200" : "border-white/15 bg-black/30 text-slate-300"}`}>{item.state === "done" ? "Ready" : item.state === "processing" ? "Working" : item.state === "error" ? "Error" : "Pending"}</span></div>
            <div className="space-y-3 p-4"><p className="truncate text-sm font-semibold text-white" title={item.source.file.name}>{item.source.file.name}</p>{item.result ? <><div className="flex items-end gap-2"><strong className={`text-2xl ${item.result.score === 5 ? "text-emerald-200" : "text-amber-100"}`}>{item.result.score}/5</strong><span className="pb-1 text-xs text-slate-400">technical readiness</span></div><dl className="space-y-1.5 font-mono text-[11px] text-slate-300"><div className="flex justify-between"><dt>Resolution</dt><dd className="text-emerald-200">{((item.result.width * item.result.height) / 1_000_000).toFixed(1)} MP</dd></div><div className="flex justify-between"><dt>Format</dt><dd className="text-emerald-200">JPEG</dd></div><div className="flex justify-between"><dt>File size</dt><dd className="text-emerald-200">{readableBytes(item.result.size)}</dd></div><div className="flex justify-between"><dt>Sharpness (est.)</dt><dd className={statusStyle(item.result.analysis.sharpnessFlag)}>{item.result.analysis.sharpness}</dd></div><div className="flex justify-between"><dt>Noise (est.)</dt><dd className={statusStyle(item.result.analysis.noiseFlag)}>{item.result.analysis.noise}</dd></div></dl><button className="secondary-button w-full justify-center" onClick={() => downloadBlob(item.result!.blob, normalizedFileName(item.source.file.name))}><Download size={15} /> Download image</button></> : <dl className="space-y-1.5 font-mono text-[11px] text-slate-300"><div className="flex justify-between"><dt>Resolution</dt><dd className={item.source.width * item.source.height >= MIN_PIXELS ? "text-emerald-200" : "text-amber-100"}>{((item.source.width * item.source.height) / 1_000_000).toFixed(1)} MP{item.source.width * item.source.height < MIN_PIXELS ? " → upscale" : ""}</dd></div><div className="flex justify-between"><dt>Source format</dt><dd className={item.source.file.type === "image/jpeg" ? "text-emerald-200" : "text-amber-100"}>{formatLabel(item.source.file.type)}{item.source.file.type === "image/jpeg" ? "" : " → JPEG"}</dd></div><div className="flex justify-between"><dt>Source size</dt><dd>{readableBytes(item.source.file.size)}</dd></div>{item.error ? <div className="pt-2 text-rose-200">{item.error}</div> : null}</dl>}</div>
          </article>)}</div>
          <section className="mt-6 border-t border-white/10 pt-6"><div className="mb-4 flex items-center gap-3"><span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 p-2 text-cyan-100"><WandSparkles size={16} /></span><div><p className="font-mono text-[10px] tracking-[0.14em] text-cyan-100">EDITABLE METADATA</p><h2 className="text-base font-semibold text-white">Prepare accurate stock submission details</h2></div></div><div className="grid gap-4 xl:grid-cols-2">{displayItems.map((item) => <MetadataEditor key={`metadata-${item.id}`} item={item} onChange={(patch) => updateMetadata(item.id, patch)} onAssist={() => requestAiAssist(item)} assistDisabled={authLoading || processing || (runAi.isPending && assistingItemId === item.id)} assistLabel={runAi.isPending && assistingItemId === item.id ? "Creating suggestions…" : hasPremiumAccess ? `AI title + keywords · ${stockMetadataCost} credits` : "Premium AI title + keywords"} />)}</div></section>
          <section className="mt-6 border-t border-white/10 pt-6"><div className="mb-4 flex items-center gap-3"><span className="rounded-md border border-amber-300/30 bg-amber-300/10 p-2 text-amber-100"><ShieldAlert size={16} /></span><div><p className="font-mono text-[10px] tracking-[0.14em] text-amber-100">SUBMISSION GUIDELINE CHECKER</p><h2 className="text-base font-semibold text-white">Measured preparation checks — not an approval prediction</h2></div></div><div className="grid gap-4 xl:grid-cols-2">{displayItems.map((item) => <article key={`checks-${item.id}`} className="rounded-xl border border-white/10 bg-black/15 p-4"><h3 className="truncate text-sm font-semibold text-white" title={item.source.file.name}>{item.source.file.name}</h3><dl className="mt-3 space-y-3">{getSubmissionChecks(item).map((check) => <div key={check.label} className="grid gap-1 border-t border-white/5 pt-3 first:border-0 first:pt-0 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]"><dt className={`font-mono text-[11px] ${statusStyle(check.status)}`}>{check.label}</dt><dd className="text-xs leading-5 text-slate-300">{check.detail}</dd></div>)}</dl></article>)}</div></section>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4"><div className="flex flex-wrap gap-3"><button className="primary-button" onClick={() => void processAll()} disabled={processing}>{processing ? <><LoaderCircle className="image-spinner" size={16} /> Preparing images…</> : <><Check size={16} /> Make images technically ready</>}</button><button className="secondary-button" onClick={() => void downloadZip()} disabled={!preparedItems.length || processing}><FileDown size={15} /> Download ZIP</button><button className="secondary-button" onClick={downloadCsv} disabled={!preparedItems.length || processing}><Download size={15} /> Export metadata CSV</button><button className="secondary-button" onClick={downloadTechnicalReport} disabled={!items.length || processing}><ShieldAlert size={15} /> Export technical report</button></div>{processing ? <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div> : null}<p className={`mt-3 font-mono text-xs ${processing ? "text-cyan-200" : "text-slate-400"}`}>{status}</p></div>
        </div> : <div className="image-workspace-hint">Your source images are processed in this browser tab. Nothing is sent to NEXA or Adobe.</div>}
        <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-5"><h2 className="text-base font-semibold text-white">Manual checks that remain yours</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300"><li>Inspect hands, eyes, teeth and text at 100–200% for artifacts.</li><li>Remove watermarks, logos, timestamps and protected content before submission.</li><li>Confirm releases, intellectual-property rights and marketplace-specific guidelines.</li><li>Review composition and commercial usefulness; technical preparation cannot judge these.</li></ul></section>
      </section>
    </main>
  </div>;
}
