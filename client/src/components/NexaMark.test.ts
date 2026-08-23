import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./NexaMark.tsx", import.meta.url), "utf8");

describe("FINEMIND AI shared logo", () => {
  it("uses the compact circular badge and an accessible FINEMIND AI wordmark", () => {
    expect(source).toContain("finemind-ai-circular-badge_6c5f776e.png");
    expect(source).toContain('rounded-full object-contain');
    expect(source).toContain("group-hover:scale-[1.06]");
    expect(source).toContain("group-hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.65)]");
    expect(source).toContain("gap-2.5");
    expect(source).toContain("tracking-[0.16em]");
    expect(source).toContain("FINEMIND <span className=\"text-sky-300\">AI</span>");
    expect(source).not.toContain("finemind-ai-lockup_4094cc3a.jpg");
  });
});
