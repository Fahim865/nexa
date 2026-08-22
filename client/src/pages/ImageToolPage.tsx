/**
 * Orbit Studio design reminder: real local image tools use clear input/output states,
 * measured cyan controls, and explicit browser-only processing language.
 */
import { NexaMark } from "@/components/NexaMark";
import type { ImageToolId, ToolDefinition } from "@/data/nexa";
import AdobeStockPrep from "@/pages/AdobeStockPrep";
import {
  asProcessedImage,
  downloadProcessedImage,
  drawRotatedImage,
  drawScaledImage,
  encodeCanvas,
  formatLabel,
  loadLocalImage,
  mimeForOutput,
  outputFileName,
  readableBytes,
  sharpenCanvas,
  type OutputImageFormat,
  type ProcessedImage,
  type SourceImage,
  validateImageFile,
} from "@/lib/imageProcessing";
import { ArrowLeft, Download, FlipHorizontal2, FlipVertical2, ImageUp, LoaderCircle, RotateCw, Upload, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ImageToolProps = { tool: ToolDefinition };
type CropRegion = { x: number; y: number; width: number; height: number };

const IMAGE_TOOL_IDS: ImageToolId[] = ["image-upscaler", "image-compressor", "image-resizer", "image-cropper", "image-converter", "image-rotator", "image-metadata", "adobe-stock-prep"];

function ImageToolShell({ tool, children }: ImageToolProps & { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const Icon = tool.icon;
  return (
    <div className="tool-route-page local-tool-page image-tool-page">
      <header className="nexa-nav tool-route-nav">
        <a href="/" aria-label="Return to NEXA home"><NexaMark /></a>
        <a className="secondary-button tool-route-home" href="/#tool-index"><ArrowLeft size={16} /> Tool index</a>
      </header>
      <main className="local-tool-main image-tool-main">
        <section className="local-tool-hero image-tool-hero">
          <div>
            <p className="section-index"><span /> IMAGE TOOLS / LOCAL PROCESSING</p>
            <div className="tool-route-icon"><Icon size={28} /></div>
            <h1>{tool.name}<br /><em>processed where it lives.</em></h1>
            <p>{tool.description} Files remain in this browser tab throughout the process.</p>
          </div>
          <div className="image-tool-orbit" aria-hidden="true"><i /><i /><i /><b><ImageUp size={17} /></b></div>
        </section>
        <section className="local-tool-workspace image-tool-workspace">
          <div className="local-tool-meta"><span>FREE / BROWSER-LOCAL IMAGE TOOL</span><button onClick={() => setLocation("/#tool-index")}><ArrowLeft size={15} /> All tools</button></div>
          {children}
        </section>
      </main>
    </div>
  );
}

function useImageSource() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);

  const chooseFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextSource = await loadLocalImage(file);
      setSource(nextSource);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "This image could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSource = useCallback(() => { setSource(null); setError(null); }, []);
  return { source, error, loading, chooseFile, clearSource };
}

function useProcessedImage() {
  const [result, setResult] = useState<ProcessedImage | null>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  const replaceResult = useCallback((nextResult: ProcessedImage) => {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return nextResult;
    });
  }, []);
  const clearResult = useCallback(() => setResult((current) => {
    if (current) URL.revokeObjectURL(current.url);
    return null;
  }), []);
  return { result, replaceResult, clearResult };
}

function ImageDropzone({ source, error, loading, onFile, onClear }: { source: SourceImage | null; error: string | null; loading: boolean; onFile: (file: File) => void; onClear: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const pickFromInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  };
  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };
  return (
    <div className="image-upload-zone-wrap">
      <input ref={inputRef} className="image-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" onChange={pickFromInput} />
      {source ? (
        <div className="image-source-summary"><img src={source.url} alt="Selected original" /><div><strong>{source.file.name}</strong><span>{source.width} × {source.height} · {readableBytes(source.file.size)} · {source.format}</span></div><button aria-label="Remove selected image" onClick={onClear}><X size={16} /></button></div>
      ) : (
        <button className={`image-dropzone ${dragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop} disabled={loading}>
          {loading ? <LoaderCircle className="image-spinner" size={24} /> : <Upload size={24} />}
          <strong>{loading ? "Reading your image…" : "Drop an image here"}</strong><span>{loading ? "Checking dimensions locally" : "or choose a JPG, PNG, WebP, GIF, or BMP file"}</span>
        </button>
      )}
      {error ? <p className="image-error">{error}</p> : null}
    </div>
  );
}

function PreviewFrame({ label, image, detail }: { label: string; image?: string; detail: string }) {
  return <div className="image-preview-frame"><div className="image-preview-label"><span>{label}</span><small>{detail}</small></div><div className="image-preview-body">{image ? <img src={image} alt={`${label} preview`} /> : <p>Awaiting an image.</p>}</div></div>;
}

function ProcessingButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: ReactNode }) {
  return <button className="primary-button" onClick={onClick} disabled={busy}>{busy ? <><LoaderCircle className="image-spinner" size={16} /> Processing…</> : children}</button>;
}

function DownloadButton({ result }: { result: ProcessedImage | null }) {
  if (!result) return null;
  return <button className="secondary-button" onClick={() => downloadProcessedImage(result)}><Download size={15} /> Download image</button>;
}

function ImageWorkspace({ source, error, loading, chooseFile, clearSource, children }: ReturnType<typeof useImageSource> & { children: ReactNode }) {
  return <><ImageDropzone source={source} error={error} loading={loading} onFile={chooseFile} onClear={clearSource} />{source ? children : <div className="image-workspace-hint">Select an image to activate the real local controls and output preview.</div>}</>;
}

function Upscaler({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const { result, replaceResult, clearResult } = useProcessedImage();
  const [scale, setScale] = useState<2 | 4>(2);
  const [busy, setBusy] = useState(false);
  const source = upload.source;
  const run = async () => {
    if (!source) return;
    setBusy(true);
    try {
      const canvas = drawScaledImage(source, source.width * scale, source.height * scale);
      sharpenCanvas(canvas);
      const blob = await encodeCanvas(canvas, source.file.type === "image/png" ? "image/png" : "image/webp", 0.92);
      replaceResult(asProcessedImage(blob, canvas.width, canvas.height, outputFileName(source.file.name, blob.type, `${scale}x-enhanced`)));
    } catch (nextError) { toast.error(nextError instanceof Error ? nextError.message : "Upscaling could not complete."); } finally { setBusy(false); }
  };
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-control-panel"><div className="image-control-heading"><div><span>UPSCALE FACTOR</span><h2>Scale with care.</h2></div><select value={scale} onChange={(event) => setScale(Number(event.target.value) as 2 | 4)}><option value={2}>2× resolution</option><option value={4}>4× resolution</option></select></div><p className="image-helper-text">Uses high-quality canvas resampling and a subtle local sharpening pass. No generative AI model is used.</p><div className="image-action-row"><ProcessingButton busy={busy} onClick={run}>Enhance image</ProcessingButton><button className="secondary-button" onClick={() => { clearResult(); upload.clearSource(); }}>Reset</button><DownloadButton result={result} /></div></div><div className="image-preview-grid"><PreviewFrame label="ORIGINAL" image={source?.url} detail={source ? `${source.width} × ${source.height}` : "Awaiting image"} /><PreviewFrame label="ENHANCED" image={result?.url} detail={result ? `${result.width} × ${result.height}` : "Run enhancement"} /></div></ImageWorkspace></ImageToolShell>;
}

function Compressor({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const { result, replaceResult, clearResult } = useProcessedImage();
  const [quality, setQuality] = useState(0.75);
  const [busy, setBusy] = useState(false);
  const source = upload.source;
  const run = async () => {
    if (!source) return;
    setBusy(true);
    try {
      const canvas = drawScaledImage(source, source.width, source.height);
      const mime = source.file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
      const blob = await encodeCanvas(canvas, mime, quality);
      replaceResult(asProcessedImage(blob, canvas.width, canvas.height, outputFileName(source.file.name, blob.type, "compressed")));
    } catch (nextError) { toast.error(nextError instanceof Error ? nextError.message : "Compression could not complete."); } finally { setBusy(false); }
  };
  const saved = result && source ? Math.max(0, source.file.size - result.blob.size) : 0;
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-control-panel"><div className="image-control-heading"><div><span>QUALITY / {Math.round(quality * 100)}%</span><h2>Make it lighter.</h2></div><output>{result ? `${readableBytes(result.blob.size)} output` : "WebP or JPG output"}</output></div><input className="image-range" type="range" min="0.35" max="0.95" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} aria-label="Compression quality" /><p className="image-helper-text">Original: {source ? readableBytes(source.file.size) : "—"} · {result && source ? `saved ${readableBytes(saved)} (${Math.round((saved / source.file.size) * 100)}%)` : "choose quality, then compress"}</p><div className="image-action-row"><ProcessingButton busy={busy} onClick={run}>Compress image</ProcessingButton><button className="secondary-button" onClick={() => { clearResult(); upload.clearSource(); }}>Reset</button><DownloadButton result={result} /></div></div><div className="image-preview-grid"><PreviewFrame label="ORIGINAL" image={source?.url} detail={source ? readableBytes(source.file.size) : "Awaiting image"} /><PreviewFrame label="COMPRESSED" image={result?.url} detail={result ? readableBytes(result.blob.size) : "Run compression"} /></div></ImageWorkspace></ImageToolShell>;
}

function Resizer({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const { result, replaceResult, clearResult } = useProcessedImage();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [busy, setBusy] = useState(false);
  const source = upload.source;
  useEffect(() => { if (upload.source) { setWidth(upload.source.width); setHeight(upload.source.height); clearResult(); } }, [upload.source, clearResult]);
  const changeWidth = (value: number) => { setWidth(value); if (upload.source && lockAspect) setHeight(Math.max(1, Math.round(value / (upload.source.width / upload.source.height)))); };
  const changeHeight = (value: number) => { setHeight(value); if (upload.source && lockAspect) setWidth(Math.max(1, Math.round(value * (upload.source.width / upload.source.height)))); };
  const run = async () => { if (!upload.source) return; setBusy(true); try { const canvas = drawScaledImage(upload.source, width, height); const mime = upload.source.file.type === "image/png" ? "image/png" : upload.source.file.type === "image/webp" ? "image/webp" : "image/jpeg"; const blob = await encodeCanvas(canvas, mime, 0.9); replaceResult(asProcessedImage(blob, canvas.width, canvas.height, outputFileName(upload.source.file.name, blob.type, "resized"))); } catch (nextError) { toast.error(nextError instanceof Error ? nextError.message : "Resize could not complete."); } finally { setBusy(false); } };
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-control-panel"><div className="image-control-heading"><div><span>OUTPUT DIMENSIONS</span><h2>Set the frame.</h2></div><label className="image-check"><input type="checkbox" checked={lockAspect} onChange={(event) => setLockAspect(event.target.checked)} /> Lock ratio</label></div><div className="image-dimension-inputs"><label>WIDTH<input type="number" min="1" value={width || ""} onChange={(event) => changeWidth(Number(event.target.value))} /></label><span>×</span><label>HEIGHT<input type="number" min="1" value={height || ""} onChange={(event) => changeHeight(Number(event.target.value))} /></label></div><div className="image-action-row"><ProcessingButton busy={busy} onClick={run}>Resize image</ProcessingButton><button className="secondary-button" onClick={() => { clearResult(); upload.clearSource(); }}>Reset</button><DownloadButton result={result} /></div></div><div className="image-preview-grid"><PreviewFrame label="ORIGINAL" image={source?.url} detail={source ? `${source.width} × ${source.height}` : "Awaiting image"} /><PreviewFrame label="RESIZED" image={result?.url} detail={result ? `${result.width} × ${result.height}` : `${width} × ${height} planned`} /></div></ImageWorkspace></ImageToolShell>;
}

function Cropper({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const { result, replaceResult, clearResult } = useProcessedImage();
  const [crop, setCrop] = useState<CropRegion>({ x: 0, y: 0, width: 100, height: 100 });
  const [busy, setBusy] = useState(false);
  const source = upload.source;
  useEffect(() => { if (upload.source) { setCrop({ x: 0, y: 0, width: 100, height: 100 }); clearResult(); } }, [upload.source, clearResult]);
  const patchCrop = (key: keyof CropRegion, value: number) => setCrop((current) => {
    const next = { ...current, [key]: value };
    next.width = Math.min(100, Math.max(5, next.width)); next.height = Math.min(100, Math.max(5, next.height));
    next.x = Math.min(Math.max(0, next.x), 100 - next.width); next.y = Math.min(Math.max(0, next.y), 100 - next.height);
    return next;
  });
  const run = async () => { if (!upload.source) return; setBusy(true); try { const sourceCrop = { x: Math.round(upload.source.width * crop.x / 100), y: Math.round(upload.source.height * crop.y / 100), width: Math.max(1, Math.round(upload.source.width * crop.width / 100)), height: Math.max(1, Math.round(upload.source.height * crop.height / 100)) }; const canvas = drawScaledImage(upload.source, sourceCrop.width, sourceCrop.height, sourceCrop); const mime = upload.source.file.type === "image/png" ? "image/png" : "image/jpeg"; const blob = await encodeCanvas(canvas, mime, 0.92); replaceResult(asProcessedImage(blob, canvas.width, canvas.height, outputFileName(upload.source.file.name, blob.type, "cropped"))); } catch (nextError) { toast.error(nextError instanceof Error ? nextError.message : "Crop could not complete."); } finally { setBusy(false); } };
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-control-panel"><div className="image-control-heading"><div><span>CROP SELECTION</span><h2>Frame the detail.</h2></div><output>{Math.round(crop.width)}% × {Math.round(crop.height)}%</output></div><div className="crop-preview">{source ? <img src={source.url} alt="Crop selection source" /> : null}<i style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }} /></div><div className="crop-controls">{(["x", "y", "width", "height"] as const).map((key) => <label key={key}>{key === "x" ? "LEFT" : key === "y" ? "TOP" : key.toUpperCase()}<input type="range" min="0" max={key === "x" ? 100 - crop.width : key === "y" ? 100 - crop.height : 100} step="1" value={crop[key]} onChange={(event) => patchCrop(key, Number(event.target.value))} /><span>{Math.round(crop[key])}%</span></label>)}</div><div className="image-action-row"><ProcessingButton busy={busy} onClick={run}>Crop image</ProcessingButton><button className="secondary-button" onClick={() => { clearResult(); upload.clearSource(); }}>Reset</button><DownloadButton result={result} /></div></div><div className="image-preview-grid"><PreviewFrame label="ORIGINAL" image={source?.url} detail={source ? `${source.width} × ${source.height}` : "Awaiting image"} /><PreviewFrame label="CROPPED" image={result?.url} detail={result ? `${result.width} × ${result.height}` : "Choose area and crop"} /></div></ImageWorkspace></ImageToolShell>;
}

const conversionTargets: Record<string, OutputImageFormat[]> = { "image/jpeg": ["png", "webp"], "image/png": ["jpeg", "webp"], "image/webp": ["png", "jpeg"], "image/gif": ["png"], "image/bmp": ["png", "jpeg"] };

function Converter({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const { result, replaceResult, clearResult } = useProcessedImage();
  const [format, setFormat] = useState<OutputImageFormat>("png");
  const [busy, setBusy] = useState(false);
  const source = upload.source;
  const targets = source ? conversionTargets[source.file.type] ?? [] : [];
  useEffect(() => { if (targets.length) setFormat(targets[0]); clearResult(); }, [upload.source, clearResult]);
  const run = async () => { if (!upload.source) return; setBusy(true); try { const canvas = drawScaledImage(upload.source, upload.source.width, upload.source.height); const mime = mimeForOutput(format); const blob = await encodeCanvas(canvas, mime, 0.9); replaceResult(asProcessedImage(blob, canvas.width, canvas.height, outputFileName(upload.source.file.name, blob.type, "converted"))); } catch (nextError) { toast.error(nextError instanceof Error ? nextError.message : "Conversion could not complete."); } finally { setBusy(false); } };
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-control-panel"><div className="image-control-heading"><div><span>FORMAT CONVERSION</span><h2>Change the container.</h2></div><output>{source?.format ?? "—"} → {format.toUpperCase()}</output></div><div className="image-converter-select"><label>OUTPUT FORMAT<select value={format} onChange={(event) => setFormat(event.target.value as OutputImageFormat)}>{targets.map((target) => <option key={target} value={target}>{target === "jpeg" ? "JPG" : target.toUpperCase()}</option>)}</select></label><p>PNG and WebP preserve source transparency where the browser decoder provides it. JPG uses a white background.</p></div><div className="image-action-row"><ProcessingButton busy={busy} onClick={run}>Convert image</ProcessingButton><button className="secondary-button" onClick={() => { clearResult(); upload.clearSource(); }}>Reset</button><DownloadButton result={result} /></div></div><div className="image-preview-grid"><PreviewFrame label={`ORIGINAL / ${source?.format ?? "—"}`} image={source?.url} detail={source?.file.name ?? "Awaiting image"} /><PreviewFrame label={`CONVERTED / ${format.toUpperCase()}`} image={result?.url} detail={result ? formatLabel(result.mime) : "Run conversion"} /></div></ImageWorkspace></ImageToolShell>;
}

function Rotator({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const { result, replaceResult, clearResult } = useProcessedImage();
  const [degrees, setDegrees] = useState<0 | 90 | 180 | 270>(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [busy, setBusy] = useState(false);
  const source = upload.source;
  const run = async () => { if (!upload.source) return; setBusy(true); try { const canvas = drawRotatedImage(upload.source, degrees, flipHorizontal, flipVertical); const mime = upload.source.file.type === "image/png" ? "image/png" : "image/jpeg"; const blob = await encodeCanvas(canvas, mime, 0.92); replaceResult(asProcessedImage(blob, canvas.width, canvas.height, outputFileName(upload.source.file.name, blob.type, "rotated"))); } catch (nextError) { toast.error(nextError instanceof Error ? nextError.message : "Rotation could not complete."); } finally { setBusy(false); } };
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-control-panel"><div className="image-control-heading"><div><span>ORIENTATION</span><h2>Rotate the signal.</h2></div><output>{degrees}°</output></div><div className="image-rotation-controls"><div>{([90, 180, 270] as const).map((value) => <button key={value} className={degrees === value ? "active" : ""} onClick={() => setDegrees(value)}><RotateCw size={15} /> {value}°</button>)}</div><div><button className={flipHorizontal ? "active" : ""} onClick={() => setFlipHorizontal((current) => !current)}><FlipHorizontal2 size={15} /> Flip horizontal</button><button className={flipVertical ? "active" : ""} onClick={() => setFlipVertical((current) => !current)}><FlipVertical2 size={15} /> Flip vertical</button></div></div><div className="image-action-row"><ProcessingButton busy={busy} onClick={run}>Apply orientation</ProcessingButton><button className="secondary-button" onClick={() => { clearResult(); upload.clearSource(); setDegrees(0); setFlipHorizontal(false); setFlipVertical(false); }}>Reset</button><DownloadButton result={result} /></div></div><div className="image-preview-grid"><PreviewFrame label="ORIGINAL" image={source?.url} detail={source ? `${source.width} × ${source.height}` : "Awaiting image"} /><PreviewFrame label="ORIENTED" image={result?.url} detail={result ? `${result.width} × ${result.height}` : "Apply rotation"} /></div></ImageWorkspace></ImageToolShell>;
}

function Metadata({ tool }: ImageToolProps) {
  const upload = useImageSource();
  const source = upload.source;
  const metadata = source ? [
    ["Name", source.file.name], ["Format", source.format], ["Dimensions", `${source.width} × ${source.height} px`], ["File size", readableBytes(source.file.size)], ["MIME type", source.file.type], ["Last modified", new Date(source.file.lastModified).toLocaleString()],
  ] : [];
  return <ImageToolShell tool={tool}><ImageWorkspace {...upload}><div className="image-metadata-layout"><PreviewFrame label="IMAGE PREVIEW" image={source?.url} detail={source ? `${source.width} × ${source.height}` : "Awaiting image"} /><div className="image-metadata-panel"><div className="image-control-heading"><div><span>FILE INFORMATION</span><h2>Read the record.</h2></div></div><dl>{metadata.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button className="secondary-button" onClick={upload.clearSource}>Inspect another image</button></div></div></ImageWorkspace></ImageToolShell>;
}

export default function ImageToolPage({ tool }: ImageToolProps) {
  if (!IMAGE_TOOL_IDS.includes(tool.id as ImageToolId)) return null;
  switch (tool.id) {
    case "image-upscaler": return <Upscaler tool={tool} />;
    case "image-compressor": return <Compressor tool={tool} />;
    case "image-resizer": return <Resizer tool={tool} />;
    case "image-cropper": return <Cropper tool={tool} />;
    case "image-converter": return <Converter tool={tool} />;
    case "image-rotator": return <Rotator tool={tool} />;
    case "image-metadata": return <Metadata tool={tool} />;
    case "adobe-stock-prep": return <AdobeStockPrep tool={tool} />;
    default: return null;
  }
}
