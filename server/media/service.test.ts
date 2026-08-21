import { describe, expect, it } from "vitest";
import { MediaProcessingError, describeMediaProcessing, validateServerMediaUpload } from "./service";

describe("media processing capability", () => {
  it("does not advertise server processing when the FFmpeg worker prerequisites are absent", () => {
    expect(describeMediaProcessing({ processor: "disabled", workerUrl: "", webhookSecret: "" })).toMatchObject({
      available: false,
      mode: "not_configured",
    });
  });

  it("does not enable an unimplemented remote FFmpeg worker configuration", () => {
    expect(describeMediaProcessing({ processor: "ffmpeg-worker", workerUrl: "https://media.internal/jobs", webhookSecret: "worker-secret" })).toMatchObject({
      available: false,
      mode: "ffmpeg_worker",
    });
    expect(new MediaProcessingError().code).toBe("MEDIA_PROCESSING_NOT_CONFIGURED");
  });

  it("recognizes an explicitly enabled local FFmpeg processor", () => {
    expect(describeMediaProcessing({ processor: "ffmpeg", workerUrl: "", webhookSecret: "", enabled: true })).toMatchObject({
      available: true,
      mode: "ffmpeg_local",
    });
  });

  it("allows only fixed media tool identifiers and bounded audio/video uploads", () => {
    expect(() => validateServerMediaUpload({ toolId: "mp4-converter", mimeType: "video/mp4", bytes: 1024 })).not.toThrow();
    expect(() => validateServerMediaUpload({ toolId: "mp4-converter;rm -rf /", mimeType: "video/mp4", bytes: 1024 })).toThrow(MediaProcessingError);
    expect(() => validateServerMediaUpload({ toolId: "mp4-converter", mimeType: "text/plain", bytes: 1024 })).toThrow(MediaProcessingError);
    expect(() => validateServerMediaUpload({ toolId: "mp4-converter", mimeType: "video/mp4", bytes: 46 * 1024 * 1024 })).toThrow(MediaProcessingError);
  });
});
