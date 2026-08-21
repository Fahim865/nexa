import { NexaMark } from "@/components/NexaMark";
import type { MediaToolId, ToolDefinition } from "@/data/nexa";
import { isMediaToolId } from "@/data/nexa";
import "./media-tool.css";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, Film, FolderUp, Gauge, Loader2, Music2, Play, Scissors, ShieldCheck, Sparkles, Video, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "wouter";

type MediaToolProps = { tool: ToolDefinition };
type MediaKind = "video" | "audio";
type MediaOutput = { blob: Blob; fileName: string; label: string; detail: string };

const LOCAL_VIDEO_IDS: readonly MediaToolId[] = ["video-to-gif", "mp4-to-gif", "video-compressor", "video-trimmer", "video-cropper"];
const LOCAL_AUDIO_IDS: readonly MediaToolId[] = ["mp3-to-wav", "audio-cutter"];
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_AUDIO_BYTES = 125 * 1024 * 1024;
const LOCAL_GIF_MAX_SECONDS = 8;

function isVideoTool(id: MediaToolId) {
  return id.includes("video") || id.includes("mp4") || id.includes("mov") || id.includes("webm");
}

function isLocallyAvailable(id: MediaToolId) {
  return LOCAL_VIDEO_IDS.includes(id) || LOCAL_AUDIO_IDS.includes(id);
}

function normalizeName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "nexa-media";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function waitForEvent(target: EventTarget, eventName: string) {
  return new Promise<void>((resolve, reject) => {
    const onSuccess = () => cleanup(resolve);
    const onError = () => cleanup(() => reject(new Error("The media frame could not be read.")));
    const cleanup = (callback: () => void) => {
      target.removeEventListener(eventName, onSuccess);
      target.removeEventListener("error", onError);
      callback();
    };
    target.addEventListener(eventName, onSuccess, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < 0.025) return;
  const seeked = waitForEvent(video, "seeked");
  video.currentTime = time;
  await seeked;
}

function chooseRecorderMime() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function createDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function audioBufferToWav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const frameCount = buffer.length;
  const output = new ArrayBuffer(44 + frameCount * channels * 2);
  const view = new DataView(output);
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + frameCount * channels * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, frameCount * channels * 2, true);
  let offset = 44;
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([output], { type: "audio/wav" });
}

async function decodeAudio(file: File) {
  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error("This browser does not support local audio decoding.");
  const context = new AudioContextConstructor();
  try {
    return await context.decodeAudioData((await file.arrayBuffer()) as ArrayBuffer);
  } finally {
    await context.close();
  }
}

function MediaToolPage({ tool }: MediaToolProps) {
  if (!isMediaToolId(tool.id)) return null;
  const toolId = tool.id;
  const kind: MediaKind = isVideoTool(toolId) ? "video" : "audio";
  const local = isLocallyAvailable(toolId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<MediaOutput | null>(null);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  const outputUrl = useMemo(() => output ? URL.createObjectURL(output.blob) : null, [output]);
  useEffect(() => () => { if (outputUrl) URL.revokeObjectURL(outputUrl); }, [outputUrl]);

  const selectFile = (candidate?: File) => {
    if (!candidate) return;
    const looksLikeVideo = /\.(mp4|mov|webm|m4v|avi)$/i.test(candidate.name) || candidate.type.startsWith("video/");
    const looksLikeAudio = /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(candidate.name) || candidate.type.startsWith("audio/");
    const valid = kind === "video" ? looksLikeVideo : looksLikeAudio;
    const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_AUDIO_BYTES;
    if (!valid) {
      setError(`Choose a supported ${kind} file for ${tool.name}.`);
      return;
    }
    if (candidate.size > maxBytes) {
      setError(`${tool.name} supports local ${kind} files up to ${formatBytes(maxBytes)}.`);
      return;
    }
    setError(null);
    setOutput(null);
    setDuration(0);
    setDimensions(null);
    setStart(0);
    setEnd(0);
    setProgress(0);
    setFile(candidate);
    setSourceUrl(URL.createObjectURL(candidate));
  };

  const clearSource = () => {
    setFile(null);
    setSourceUrl(null);
    setOutput(null);
    setDuration(0);
    setDimensions(null);
    setStart(0);
    setEnd(0);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const setMetadata = (element: HTMLVideoElement | HTMLAudioElement) => {
    const mediaDuration = Number.isFinite(element.duration) ? element.duration : 0;
    setDuration(mediaDuration);
    setStart(0);
    setEnd(mediaDuration);
    if (element instanceof HTMLVideoElement) setDimensions({ width: element.videoWidth, height: element.videoHeight });
  };

  const rangeIsValid = () => {
    if (!duration || end <= start) {
      setError("Set an end time that is after the start time.");
      return false;
    }
    return true;
  };

  const runGif = async () => {
    const video = videoRef.current;
    if (!video || !file || !rangeIsValid()) return;
    const clipDuration = Math.min(end - start, LOCAL_GIF_MAX_SECONDS);
    if (clipDuration <= 0) return;
    setBusy(true); setError(null); setOutput(null); setProgress(0);
    try {
      const { GIFEncoder, applyPalette, quantize } = await import("gifenc");
      await seekVideo(video, start);
      const scale = Math.min(1, 640 / Math.max(video.videoWidth, 1));
      const width = Math.max(2, Math.floor(video.videoWidth * scale / 2) * 2);
      const height = Math.max(2, Math.floor(video.videoHeight * scale / 2) * 2);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas frame processing is unavailable in this browser.");
      const frames = Math.max(2, Math.min(64, Math.ceil(clipDuration * 8)));
      const encoder = GIFEncoder();
      let palette: number[][] | null = null;
      for (let frame = 0; frame < frames; frame += 1) {
        await seekVideo(video, Math.min(start + (frame / 8), start + clipDuration));
        context.drawImage(video, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        palette ??= quantize(pixels, 256);
        encoder.writeFrame(applyPalette(pixels, palette), width, height, { palette: frame === 0 ? palette : undefined, delay: 125, repeat: 0 });
        setProgress(Math.round(((frame + 1) / frames) * 100));
      }
      encoder.finish();
      const encodedBytes = encoder.bytesView();
      const ownedBytes = new Uint8Array(encodedBytes.byteLength);
      ownedBytes.set(encodedBytes);
      setOutput({ blob: new Blob([ownedBytes.buffer], { type: "image/gif" }), fileName: `${normalizeName(file.name)}-clip.gif`, label: "Animated GIF ready", detail: `${frames} browser-encoded frames · ${width}×${height} · ${formatTime(clipDuration)} clip` });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "GIF generation could not complete.");
    } finally { setBusy(false); }
  };

  const recordVideo = async (mode: "compress" | "trim" | "crop") => {
    const video = videoRef.current;
    if (!video || !file || !rangeIsValid()) return;
    if (typeof MediaRecorder === "undefined") { setError("This browser cannot locally re-encode video with MediaRecorder."); return; }
    const captureVideo = video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
    const originalStream = captureVideo.captureStream?.() ?? captureVideo.mozCaptureStream?.();
    if (!originalStream) { setError("This browser does not expose video capture for local re-encoding. Try a current Chromium browser."); return; }
    const clipDuration = Math.min(end - start, 30);
    const targetWidth = mode === "compress" ? Math.max(320, Math.floor(video.videoWidth * 0.65 / 2) * 2) : video.videoWidth;
    const targetHeight = mode === "compress" ? Math.max(180, Math.floor(video.videoHeight * 0.65 / 2) * 2) : video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = mode === "crop" ? Math.max(2, Math.floor(targetWidth * 0.78 / 2) * 2) : targetWidth;
    canvas.height = mode === "crop" ? Math.max(2, Math.floor(targetHeight * 0.78 / 2) * 2) : targetHeight;
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) { setError("Canvas video processing is unavailable in this browser."); return; }
    setBusy(true); setError(null); setOutput(null); setProgress(0);
    let animationFrame = 0;
    try {
      const stream = canvas.captureStream(30);
      originalStream.getAudioTracks().forEach((track) => stream.addTrack(track));
      const mimeType = chooseRecorderMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: mode === "compress" ? 1_200_000 : 2_500_000 } : undefined);
      const chunks: BlobPart[] = [];
      const recorded = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error("Browser video recording could not complete."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      });
      const draw = () => {
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        if (mode === "crop") {
          const cropWidth = Math.min(sourceWidth, sourceHeight * (canvas.width / canvas.height));
          const cropHeight = Math.min(sourceHeight, sourceWidth * (canvas.height / canvas.width));
          canvasContext.drawImage(video, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        } else {
          canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        setProgress(Math.min(99, Math.round(((video.currentTime - start) / clipDuration) * 100)));
        if (video.currentTime >= start + clipDuration - 0.04 || video.ended) {
          video.pause(); recorder.stop(); return;
        }
        animationFrame = requestAnimationFrame(draw);
      };
      await seekVideo(video, start);
      recorder.start(250);
      await video.play();
      draw();
      const blob = await recorded;
      setProgress(100);
      const suffix = mode === "compress" ? "compressed" : mode === "crop" ? "cropped" : "trimmed";
      setOutput({ blob, fileName: `${normalizeName(file.name)}-${suffix}.webm`, label: `${mode === "compress" ? "Smaller" : "Edited"} WebM ready`, detail: `${canvas.width}×${canvas.height} browser-recorded WebM · ${formatTime(clipDuration)} clip` });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Local video processing could not complete.");
    } finally { cancelAnimationFrame(animationFrame); setBusy(false); }
  };

  const runAudio = async () => {
    if (!file) return;
    if (toolId === "audio-cutter" && !rangeIsValid()) return;
    setBusy(true); setError(null); setOutput(null); setProgress(15);
    try {
      const decoded = await decodeAudio(file);
      setProgress(55);
      let outputBuffer = decoded;
      if (toolId === "audio-cutter") {
        const firstFrame = Math.floor(start * decoded.sampleRate);
        const frameLength = Math.floor((end - start) * decoded.sampleRate);
        const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) throw new Error("This browser does not support local audio cutting.");
        const context = new AudioContextConstructor();
        try {
          outputBuffer = context.createBuffer(decoded.numberOfChannels, frameLength, decoded.sampleRate);
          for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
            const samples = new Float32Array(frameLength);
            samples.set(decoded.getChannelData(channel).subarray(firstFrame, firstFrame + frameLength));
            outputBuffer.copyToChannel(samples, channel);
          }
        } finally { await context.close(); }
      }
      const blob = audioBufferToWav(outputBuffer);
      setProgress(100);
      const trimmed = toolId === "audio-cutter";
      setOutput({ blob, fileName: `${normalizeName(file.name)}${trimmed ? "-cut" : ""}.wav`, label: trimmed ? "WAV clip ready" : "WAV conversion ready", detail: `${outputBuffer.numberOfChannels === 1 ? "Mono" : "Stereo"} PCM WAV · ${formatTime(outputBuffer.duration)}` });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Local audio processing could not complete.");
    } finally { setBusy(false); }
  };

  const runLocalTool = () => {
    if (toolId === "video-to-gif" || toolId === "mp4-to-gif") void runGif();
    else if (toolId === "video-compressor") void recordVideo("compress");
    else if (toolId === "video-trimmer") void recordVideo("trim");
    else if (toolId === "video-cropper") void recordVideo("crop");
    else void runAudio();
  };

  const actionCopy = toolId.includes("gif") ? "Create GIF" : toolId === "video-compressor" ? "Create smaller WebM" : toolId === "video-cropper" ? "Crop & export WebM" : toolId === "video-trimmer" ? "Trim & export WebM" : toolId === "audio-cutter" ? "Cut & export WAV" : "Convert to WAV";
  const showRange = local && (toolId.includes("gif") || toolId.includes("trimmer") || toolId.includes("cropper") || toolId.includes("cutter") || toolId.includes("compressor"));
  const titleAccent = kind === "video" ? "Motion, locally." : "Sound, locally.";

  return <main className="media-tool-page min-h-screen overflow-hidden bg-[#06101d] text-white">
    <header className="nexa-nav"><div className="section-shell flex h-16 items-center justify-between"><Link href="/"><NexaMark withWordmark={false} imageClassName="h-9 w-9" /></Link><Link href="/tools" className="media-back-link"><ArrowLeft size={15} /> All tools</Link></div></header>
    <section className="media-tool-hero section-shell pt-30"><div className="media-tool-kicker"><span /> VIDEO & AUDIO / LOCAL STUDIO</div><div className="media-hero-grid"><div><h1>{tool.name}<em>{titleAccent}</em></h1><p>{tool.description}</p><div className="media-hero-proof"><ShieldCheck size={15} /> {local ? "Processed locally — your source stays in this browser." : "FFmpeg processing is not configured — no conversion will be simulated."}</div></div><div className="media-orbit" aria-hidden="true"><i /><i /><b>{kind === "video" ? <Film size={24} /> : <Music2 size={24} />}</b><span /></div></div></section>
    <section className="section-shell pb-20"><div className="media-workspace">
      <div className="media-workspace-top"><div><span className="micro-label">01 / SOURCE</span><h2>Bring in a {kind} file.</h2></div><span className={`media-capability ${local ? "is-local" : "is-server"}`}>{local ? "LOCAL PROCESSING" : "FFMPEG REQUIRED"}</span></div>
      <div className="media-tool-grid">
        <section className="media-panel">
          {!file ? <div className="media-dropzone" onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} onDragOver={(event) => event.preventDefault()}><FolderUp size={28} /><strong>Drop a {kind} file here</strong><p>{kind === "video" ? "MP4, MOV or WebM" : "MP3, WAV, OGG, M4A, AAC or FLAC"} · up to {formatBytes(kind === "video" ? MAX_VIDEO_BYTES : MAX_AUDIO_BYTES)}</p><button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>Choose file</button><input ref={inputRef} type="file" accept={kind === "video" ? "video/*,.mov" : "audio/*"} onChange={(event) => selectFile(event.target.files?.[0])} /></div> : <div className="media-source-card"><div className="media-source-head"><div className="media-source-icon">{kind === "video" ? <Video size={19} /> : <Volume2 size={19} />}</div><div><strong>{file.name}</strong><p>{formatBytes(file.size)} · {file.type || "Local media file"}</p></div><button type="button" aria-label="Remove selected file" onClick={clearSource}><X size={16} /></button></div>{kind === "video" && sourceUrl ? <video ref={videoRef} className="media-preview" src={sourceUrl} controls preload="metadata" onLoadedMetadata={(event) => setMetadata(event.currentTarget)} /> : null}{kind === "audio" && sourceUrl ? <audio className="media-audio" src={sourceUrl} controls preload="metadata" onLoadedMetadata={(event) => setMetadata(event.currentTarget)} /> : null}<div className="media-source-stats"><span>{duration ? `${formatTime(duration)} duration` : "Reading metadata…"}</span>{dimensions ? <span>{dimensions.width}×{dimensions.height}</span> : null}<span>{kind.toUpperCase()}</span></div></div>}
          {file && showRange ? <div className="media-range"><div className="media-range-heading"><span className="micro-label">02 / RANGE</span><small>{toolId.includes("gif") ? `Maximum ${LOCAL_GIF_MAX_SECONDS}s GIF clip` : "Maximum 30-second browser export"}</small></div><div className="media-range-grid"><label>Start <input type="number" min="0" max={Math.max(0, duration - 0.1)} step="0.1" value={Number.isFinite(start) ? start : 0} onChange={(event) => setStart(Math.max(0, Number(event.target.value)))} /></label><label>End <input type="number" min="0.1" max={duration || undefined} step="0.1" value={Number.isFinite(end) ? end : 0} onChange={(event) => setEnd(Math.min(duration || Number(event.target.value), Number(event.target.value)))} /></label></div><input className="media-range-slider" type="range" min="0" max={duration || 1} step="0.1" value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), end - 0.1))} /><input className="media-range-slider" type="range" min="0" max={duration || 1} step="0.1" value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 0.1))} /></div> : null}
          {error ? <div className="media-error"><AlertTriangle size={16} /><span>{error}</span></div> : null}
        </section>
        <aside className="media-panel media-result-panel"><div className="media-result-heading"><div><span className="micro-label">03 / OUTPUT</span><h2>{local ? "Create a real local file." : "Server media pipeline required."}</h2></div>{local ? <Sparkles size={20} /> : <Gauge size={20} />}</div>{!local ? <div className="media-server-note"><AlertTriangle size={19} /><div><strong>No result will be fabricated.</strong><p>This operation needs a configured FFmpeg worker, trusted upload storage and a signed completion callback. Your selected file remains only in this browser.</p></div></div> : output ? <div className="media-output"><CheckCircle2 size={22} /><strong>{output.label}</strong><p>{output.detail}</p>{outputUrl && output.blob.type.startsWith("image/") ? <img className="media-output-image" src={outputUrl} alt="Generated GIF preview" /> : null}{outputUrl && output.blob.type.startsWith("video/") ? <video className="media-output-video" src={outputUrl} controls /> : null}{outputUrl && output.blob.type.startsWith("audio/") ? <audio className="media-audio" src={outputUrl} controls /> : null}<button type="button" className="primary-button" onClick={() => createDownload(output.blob, output.fileName)}><Download size={16} /> Download {output.fileName.split(".").pop()?.toUpperCase()}</button></div> : <div className="media-empty"><Play size={24} /><strong>Ready when you are.</strong><p>Select a file, adjust the clip range when needed, then create a real local output.</p></div>}{local ? <div className="media-run-area"><button type="button" className="primary-button" disabled={!file || busy || !duration} onClick={runLocalTool}>{busy ? <><Loader2 className="animate-spin" size={16} /> Processing {progress}%</> : <><Scissors size={16} /> {actionCopy}</>}</button>{busy ? <div className="media-progress"><span style={{ width: `${progress}%` }} /></div> : null}<small>{toolId.includes("gif") ? "GIF exports are limited to 8 seconds and 640px wide for stable in-browser processing." : "Local browser exports may produce WebM or PCM WAV rather than a source-matching container."}</small></div> : <div className="media-server-footer"><ShieldCheck size={15} /> A configured worker may accept server-stored sources only after signed job authorization.</div>}</aside>
      </div>
    </div></section>
  </main>;
}

export default MediaToolPage;
