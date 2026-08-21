import { describe, expect, it } from "vitest";
import { MediaProcessingError, describeMediaProcessing } from "./service";

describe("media processing capability", () => {
  it("does not advertise server processing when the FFmpeg worker prerequisites are absent", () => {
    expect(describeMediaProcessing({ processor: "disabled", workerUrl: "", webhookSecret: "" })).toMatchObject({
      available: false,
      mode: "not_configured",
    });
  });

  it("marks the server capability ready only with explicit FFmpeg worker configuration", () => {
    expect(describeMediaProcessing({ processor: "ffmpeg-worker", workerUrl: "https://media.internal/jobs", webhookSecret: "worker-secret" })).toMatchObject({
      available: true,
      mode: "ffmpeg_worker",
    });
    expect(new MediaProcessingError().code).toBe("MEDIA_PROCESSING_NOT_CONFIGURED");
  });
});
