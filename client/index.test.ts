import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("./src/pages/Home.tsx", import.meta.url), "utf8");

describe("production HTML shell", () => {
  it("contains exactly one document and one React root without leaked patch markers", () => {
    expect(indexHtml.match(/<!doctype html>/gi)).toHaveLength(1);
    expect(indexHtml.match(/id="root"/g)).toHaveLength(1);
    expect(indexHtml).not.toContain("@@");
  });

  it("uses the verified FINEMIND AI badge as the browser favicon", () => {
    expect(indexHtml).toContain('rel="icon" type="image/png" href="/manus-storage/finemind-ai-circular-badge_6c5f776e.png"');
    expect(indexHtml).not.toContain("nexapremium-mpo86vkq.manus.space/manus-storage/finemind-ai-circular-badge_6c5f776e.png");
  });

  it("prioritizes the existing homepage hero artwork for LCP", () => {
    expect(homeSource).toContain('src="/manus-storage/nexa-orbit-hero_2ebd6525.jpg"');
    expect(homeSource).toContain('fetchPriority="high"');
    expect(homeSource).toContain('decoding="async"');
  });
});
