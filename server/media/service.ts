import { ENV } from "../_core/env";

export type MediaProcessingConfig = {
  processor: string;
  workerUrl: string;
  webhookSecret: string;
};

export type MediaProcessingCapability = {
  available: boolean;
  mode: "not_configured" | "ffmpeg_worker";
  message: string;
  supports: readonly ["transcode", "extract_audio", "encode_audio", "compress"];
};

export class MediaProcessingError extends Error {
  readonly code = "MEDIA_PROCESSING_NOT_CONFIGURED" as const;

  constructor(message = "FFmpeg media processing is not configured for this environment.") {
    super(message);
    this.name = "MediaProcessingError";
  }
}

export function describeMediaProcessing(config: MediaProcessingConfig): MediaProcessingCapability {
  const available = config.processor === "ffmpeg-worker" && Boolean(config.workerUrl) && Boolean(config.webhookSecret);
  return {
    available,
    mode: available ? "ffmpeg_worker" : "not_configured",
    message: available
      ? "A server-side FFmpeg worker is configured. Jobs must still be authorized and completed through a verified worker callback."
      : "Server-side FFmpeg processing is not configured. No media conversion job can be created.",
    supports: ["transcode", "extract_audio", "encode_audio", "compress"],
  };
}

export function getMediaProcessingCapability() {
  return describeMediaProcessing({
    processor: ENV.nexaMediaProcessor,
    workerUrl: ENV.nexaMediaWorkerUrl,
    webhookSecret: ENV.nexaMediaWebhookSecret,
  });
}

/**
 * Future server jobs must call this before accepting a stored source. This function intentionally
 * provides no fallback encoder, so an unconfigured deployment cannot report a fake result.
 */
export function requireMediaProcessingWorker() {
  const capability = getMediaProcessingCapability();
  if (!capability.available) throw new MediaProcessingError();
  return {
    workerUrl: ENV.nexaMediaWorkerUrl,
    webhookSecret: ENV.nexaMediaWebhookSecret,
  };
}
