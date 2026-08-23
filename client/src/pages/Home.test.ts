import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("FINEMIND AI homepage wordmark", () => {
  it("places a bold brand label between the header logo and navigation, while presenting the hero brand prominently", () => {
    expect(source).toContain("<NexaMark withWordmark />");
    expect(source).toContain('className="hero-brand-wordmark"');
    expect(source).toContain("FINEMIND <span>AI</span>");
  });
});
