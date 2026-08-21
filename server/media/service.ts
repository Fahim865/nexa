import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ENV } from "../_core/env";
import { storageGetSignedUrl, storagePut } from "../storage";

export type MediaProcessingConfig = {
  processor: string;
  workerUrl: string;
  webhookSecret: string;
  enabled?: boolean;
};

export type MediaProcessingCapability = {
  available: boolean;
  mode: "not_configured" | "ffmpeg_worker" | "ffmpeg_local";
  message: string;
  supports: readonly ["transcode", "extract_audio", "encode_audio", "compress"];
};

export type ServerMediaToolId =
  | "mp4-converter"
  | "mov-to-mp4"
  | "webm-to-mp4"
  | "video-to-mp3"
  | "mp4-to-mp3"
  | "mp3-converter"
  | "wav-converter"
  | "mp3-to-ogg"
  | "audio-compressor";

type OutputSpec = {
  extension: "mp4" | "mp3" | "wav" | "ogg";
  contentType: string;
  args: (inputPath: string, outputPath: string) => string[];
};

export class MediaProcessingError extends Error {
  constructor(
    public readonly code:
      | "MEDIA_PROCESSING_NOT_CONFIGURED"
      | "MEDIA_PROCESSING_INVALID_FILE"
      | "MEDIA_PROCESSING_BUSY"
      | "MEDIA_PROCESSING_FAILED" = "MEDIA_PROCESSING_NOT_CONFIGURED",
    message = "FFmpeg media processing is not configured for this environment.",
  ) {
    super(message);
    this.name = "MediaProcessingError";
  }
}

const MAX_SERVER_UPLOAD_BYTES = 45 * 1024 * 1024;
const FFMPEG_TIMEOUT_MS = 160_000;
let activeProcessCount = 0;

const SERVER_TOOL_IDS = new Set<ServerMediaToolId>([
  "mp4-converter", "mov-to-mp4", "webm-to-mp4", "video-to-mp3", "mp4-to-mp3",
  "mp3-converter", "wav-converter", "mp3-to-ogg", "audio-compressor",
]);

const transcodeMp4 = (input: string, output: string) => ["-i", input, "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart", output];
const extractMp3 = (input: string, output: string) => ["-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", "192k", output];

const OUTPUT_SPECS: Record<ServerMediaToolId, OutputSpec> = {
  "mp4-converter": { extension: "mp4", contentType: "video/mp4", args: transcodeMp4 },
  "mov-to-mp4": { extension: "mp4", contentType: "video/mp4", args: transcodeMp4 },
  "webm-to-mp4": { extension: "mp4", contentType: "video/mp4", args: transcodeMp4 },
  "video-to-mp3": { extension: "mp3", contentType: "audio/mpeg", args: extractMp3 },
  "mp4-to-mp3": { extension: "mp3", contentType: "audio/mpeg", args: extractMp3 },
  "mp3-converter": { extension: "mp3", contentType: "audio/mpeg", args: (input, output) => ["-i", input, "-c:a", "libmp3lame", "-b:a", "192k", output] },
  "wav-converter": { extension: "wav", contentType: "audio/wav", args: (input, output) => ["-i", input, "-c:a", "pcm_s16le", output] },
  "mp3-to-ogg": { extension: "ogg", contentType: "audio/ogg", args: (input, output) => ["-i", input, "-c:a", "libvorbis", "-q:a", "5", output] },
  "audio-compressor": { extension: "mp3", contentType: "audio/mpeg", args: (input, output) => ["-i", input, "-c:a", "libmp3lame", "-b:a", "96k", output] },
};

export function isServerMediaToolId(value: string): value is ServerMediaToolId {
  return SERVER_TOOL_IDS.has(value as ServerMediaToolId);
}

export function describeMediaProcessing(config: MediaProcessingConfig): MediaProcessingCapability {
  const localFfmpeg = config.processor === "ffmpeg" && config.enabled === true;
  const remoteWorker = config.processor === "ffmpeg-worker" && Boolean(config.workerUrl) && Boolean(config.webhookSecret);
  // This server currently executes only its fixed local FFmpeg operations. A
  // worker configuration is retained for a future signed-job implementation,
  // but must never enable a client action until that dispatch path exists.
  const available = localFfmpeg;
  const mode = localFfmpeg ? "ffmpeg_local" : remoteWorker ? "ffmpeg_worker" : "not_configured";
  return {
    available,
    mode,
    message: localFfmpeg
      ? "A server-side FFmpeg processor is enabled. Requests are authenticated, size-limited and use fixed media operations."
      : remoteWorker
        ? "A remote FFmpeg worker is configured, but this server has no signed job-dispatch implementation. No media job can be created."
        : "Server-side FFmpeg processing is not configured. No media conversion job can be created.",
    supports: ["transcode", "extract_audio", "encode_audio", "compress"],
  };
}

export function getMediaProcessingCapability() {
  return describeMediaProcessing({
    processor: ENV.nexaMediaProcessor,
    workerUrl: ENV.nexaMediaWorkerUrl,
    webhookSecret: ENV.nexaMediaWebhookSecret,
    enabled: ENV.nexaMediaProcessingEnabled,
  });
}

export function requireMediaProcessingWorker() {
  const capability = getMediaProcessingCapability();
  if (!capability.available) throw new MediaProcessingError();
  return { workerUrl: ENV.nexaMediaWorkerUrl, webhookSecret: ENV.nexaMediaWebhookSecret };
}

export function validateServerMediaUpload(input: { toolId: string; mimeType: string; bytes: number }) {
  if (!isServerMediaToolId(input.toolId)) throw new MediaProcessingError("MEDIA_PROCESSING_INVALID_FILE", "This tool is not a server-side FFmpeg operation.");
  if (!input.mimeType.startsWith("video/") && !input.mimeType.startsWith("audio/")) throw new MediaProcessingError("MEDIA_PROCESSING_INVALID_FILE", "Only audio and video files can be processed.");
  if (!Number.isFinite(input.bytes) || input.bytes <= 0 || input.bytes > MAX_SERVER_UPLOAD_BYTES) throw new MediaProcessingError("MEDIA_PROCESSING_INVALID_FILE", "Media files must be between 1 byte and 45 MB.");
}

function sourceExtension(mimeType: string) {
  const extension = mimeType.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  return extension || "bin";
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), FFMPEG_TIMEOUT_MS);
    child.stderr.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString()}`.slice(-4_000); });
    child.on("error", (error) => { clearTimeout(timer); reject(new MediaProcessingError("MEDIA_PROCESSING_FAILED", `FFmpeg could not start: ${error.message}`)); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new MediaProcessingError("MEDIA_PROCESSING_FAILED", `FFmpeg could not process this file${stderr ? `: ${stderr.trim().slice(0, 500)}` : "."}`));
    });
  });
}

export async function processServerMedia(input: { userId: number; toolId: string; mimeType: string; bytes: Buffer }) {
  validateServerMediaUpload({ toolId: input.toolId, mimeType: input.mimeType, bytes: input.bytes.byteLength });
  if (getMediaProcessingCapability().mode !== "ffmpeg_local") throw new MediaProcessingError();
  if (activeProcessCount >= 1) throw new MediaProcessingError("MEDIA_PROCESSING_BUSY", "The media processor is busy. Please retry shortly.");

  const spec = OUTPUT_SPECS[input.toolId as ServerMediaToolId];
  activeProcessCount += 1;
  const workDir = await mkdtemp(join(tmpdir(), "nexa-media-"));
  const inputPath = join(workDir, `source.${sourceExtension(input.mimeType)}`);
  const outputPath = join(workDir, `result.${spec.extension}`);
  try {
    await writeFile(inputPath, input.bytes);
    await runFfmpeg(spec.args(inputPath, outputPath));
    const output = await readFile(outputPath);
    if (output.byteLength === 0) throw new MediaProcessingError("MEDIA_PROCESSING_FAILED", "FFmpeg returned an empty output file.");
    const stored = await storagePut(`media/${input.userId}/${crypto.randomUUID()}.${spec.extension}`, output, spec.contentType);
    const url = await storageGetSignedUrl(stored.key);
    return { url, fileName: `nexa-${input.toolId}.${spec.extension}`, contentType: spec.contentType };
  } finally {
    activeProcessCount = Math.max(0, activeProcessCount - 1);
    await rm(workDir, { recursive: true, force: true });
  }
}
