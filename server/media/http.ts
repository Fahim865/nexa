import type { Express, Request, Response } from "express";
import express from "express";
import { sdk } from "../_core/sdk";
import { MediaProcessingError, processServerMedia } from "./service";

const MEDIA_UPLOAD_LIMIT = "46mb";

function sendMediaError(res: Response, error: unknown) {
  if (error instanceof MediaProcessingError) {
    const status = error.code === "MEDIA_PROCESSING_NOT_CONFIGURED" ? 503 : error.code === "MEDIA_PROCESSING_BUSY" ? 429 : error.code === "MEDIA_PROCESSING_INVALID_FILE" ? 400 : 422;
    res.status(status).json({ error: error.code, message: error.message });
    return;
  }
  if (error instanceof Error && error.name === "ForbiddenError") {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Please sign in before processing media." });
    return;
  }
  console.error("[media] Processing failed", error);
  res.status(500).json({ error: "MEDIA_PROCESSING_FAILED", message: "The media processor could not complete this request." });
}

export function registerMediaProcessingRoutes(app: Express) {
  app.post("/api/media/process", express.raw({ type: () => true, limit: MEDIA_UPLOAD_LIMIT }), async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const toolId = req.header("x-nexa-media-tool") ?? "";
      const mimeType = req.header("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
      if (!Buffer.isBuffer(req.body)) throw new MediaProcessingError("MEDIA_PROCESSING_INVALID_FILE", "Upload media as binary request data.");
      const result = await processServerMedia({ userId: user.id, toolId, mimeType, bytes: req.body });
      res.status(200).json(result);
    } catch (error) {
      sendMediaError(res, error);
    }
  });
}
