/**
 * Local-only Adobe Stock technical preparation. This workspace intentionally
 * reports measurable technical checks, never a prediction of marketplace approval.
 */
import { NexaMark } from "@/components/NexaMark";
import type { ToolDefinition } from "@/data/nexa";
import { assertCanvasSize, encodeCanvas, formatLabel, loadLocalImage, readableBytes, sharpenCanvas, type SourceImage } from "@/lib/imageProcessing";
import JSZip from "jszip";
import { ArrowLeft, Check, Download, FileDown, ImagePlus, LoaderCircle, Sparkles, Trash2, Upload, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MAX_BATCH_FILES = 20;
const MAX_FILE_BYTES = 45 * 1024 * 1024;
const MIN_PIXELS = 4_000_000;
const TARGET_PIXELS = 4_300_000;

type QualityFlag = "ok" | "review" | "warning";
type TechnicalAnalysis = { sharpness: string; sharpnessFlag: QualityFlag; noise: string; noiseFlag: QualityFlag };
type BatchItem = {
  id: string;
  source: SourceImage;
  state: "pending" | "processing" | "done" | "error";
  error?: string;
  result?: { blob: Blob; url: string; width: number; height: number; size: number; score: number; analysis: TechnicalAnalysis };
};

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

export default function AdobeStockPrep({ tool }: { tool: ToolDefinition }) {
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<BatchItem[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Add up to 20 images to begin.");
  const [priorityFirst, setPriorityFirst] = useState(false);

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
        nextItems.push({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, source, state: "pending" });
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
    const header = "Filename,Resolution (MP),File size,Technical readiness,Sharpness estimate,Noise estimate\n";
    const rows = preparedItems.map((item) => {
      const result = item.result!;
      return `"${item.source.file.name.replaceAll('"', '""')}",${((result.width * result.height) / 1_000_000).toFixed(1)},${readableBytes(result.size)},${result.score}/5,"${result.analysis.sharpness}","${result.analysis.noise}"`;
    });
    downloadBlob(new Blob([header, rows.join("\n")], { type: "text/csv;charset=utf-8" }), "nexa-adobe-stock-technical-report.csv");
    setStatus("Technical report CSV download started.");
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
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4"><div className="flex flex-wrap gap-3"><button className="primary-button" onClick={() => void processAll()} disabled={processing}>{processing ? <><LoaderCircle className="image-spinner" size={16} /> Preparing images…</> : <><Check size={16} /> Make images technically ready</>}</button><button className="secondary-button" onClick={() => void downloadZip()} disabled={!preparedItems.length || processing}><FileDown size={15} /> Download ZIP</button><button className="secondary-button" onClick={downloadCsv} disabled={!preparedItems.length || processing}><Download size={15} /> Export CSV</button></div>{processing ? <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div> : null}<p className={`mt-3 font-mono text-xs ${processing ? "text-cyan-200" : "text-slate-400"}`}>{status}</p></div>
        </div> : <div className="image-workspace-hint">Your source images are processed in this browser tab. Nothing is sent to NEXA or Adobe.</div>}
        <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-5"><h2 className="text-base font-semibold text-white">Manual checks that remain yours</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300"><li>Inspect hands, eyes, teeth and text at 100–200% for artifacts.</li><li>Remove watermarks, logos, timestamps and protected content before submission.</li><li>Confirm releases, intellectual-property rights and marketplace-specific guidelines.</li><li>Review composition and commercial usefulness; technical preparation cannot judge these.</li></ul></section>
      </section>
    </main>
  </div>;
}
