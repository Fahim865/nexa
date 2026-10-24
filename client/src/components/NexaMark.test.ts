import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./NexaMark.tsx", import.meta.url), "utf8");

describe("FINEMIND AI shared logo", () => {
  it("uses a compact circular badge with a subtle natural hover treatment", () => {
    expect(source).toContain("finemind-ai-circular-badge_6c5f776e.png");
    expect(source).toContain('const source = "/manus-storage/finemind-ai-circular-badge_6c5f776e.png"');
    expect(source).not.toContain("nexapremium-mpo86vkq.manus.space/manus-storage");
    expect(source).toContain('rounded-full object-contain');
    expect(source).toContain("withWordmark = false");
    expect(source).toContain("font-extrabold text-[0.74rem]");
    expect(source).toContain("lg:inline-flex");
    expect(source).toContain("group-hover:scale-[1.045]");
    expect(source).toContain("group-hover:drop-shadow-[0_0_6px_rgba(56,189,248,0.34)]");
    expect(source).toContain("group-hover:shadow-[0_7px_16px_rgba(2,8,23,0.46)]");
    expect(source).toContain("gap-2.5");
    expect(source).not.toContain("finemind-ai-lockup_4094cc3a.jpg");
  });
});
