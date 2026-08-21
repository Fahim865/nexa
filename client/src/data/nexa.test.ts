import { describe, expect, it } from "vitest";
import { MEDIA_TOOL_IDS, TOOL_REGISTRY, getToolById, isMediaToolId } from "./nexa";

const LOCAL_MEDIA_TOOL_IDS = [
  "video-to-gif",
  "mp4-to-gif",
  "video-compressor",
  "video-trimmer",
  "video-cropper",
  "mp3-to-wav",
  "audio-cutter",
] as const;

describe("Video & Audio Tools registry", () => {
  it("registers all requested media tools with unique canonical routes", () => {
    const mediaTools = TOOL_REGISTRY.filter((tool) => tool.category === "Video & Audio Tools");

    expect(mediaTools).toHaveLength(16);
    expect(mediaTools.map((tool) => tool.id)).toEqual(MEDIA_TOOL_IDS);
    expect(new Set(mediaTools.map((tool) => tool.route)).size).toBe(mediaTools.length);
    expect(mediaTools.every((tool) => tool.route.startsWith("/tools/"))).toBe(true);
    expect(mediaTools.every((tool) => isMediaToolId(tool.id))).toBe(true);
  });

  it("marks only browser-supported operations as locally available", () => {
    for (const id of LOCAL_MEDIA_TOOL_IDS) {
      expect(getToolById(id)?.status).toBe("available");
    }

    for (const id of MEDIA_TOOL_IDS.filter((id) => !LOCAL_MEDIA_TOOL_IDS.includes(id as (typeof LOCAL_MEDIA_TOOL_IDS)[number]))) {
      expect(getToolById(id)?.status).toBe("beta");
    }
  });
});
