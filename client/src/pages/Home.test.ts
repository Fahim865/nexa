import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("FINEMIND AI homepage wordmark", () => {
  it("keeps the header logo compact and presents the brand prominently in the hero", () => {
    expect(source).toContain("<NexaMark />");
    expect(source).toContain('text-3xl font-semibold tracking-[0.14em]');
    expect(source).toContain('FINEMIND <span className="text-sky-300">AI</span>');
    expect(source).toContain("sm:text-4xl lg:text-5xl");
  });
});
