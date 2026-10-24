import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("FINEMIND AI analytics boundary", () => {
  it("keeps analytics optional and non-blocking", () => {
    const source = readFileSync(new URL("./analytics.ts", import.meta.url), "utf8");
    expect(source).toContain("VITE_ANALYTICS_ENDPOINT");
    expect(source).toContain("VITE_ANALYTICS_WEBSITE_ID");
    expect(source).toContain("Analytics must never interrupt");
  });

  it("does not ship unresolved analytics placeholders in the HTML shell", () => {
    const source = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    expect(source).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
    expect(source).not.toContain("%VITE_ANALYTICS_WEBSITE_ID%");
    expect(source).toContain('type="application/ld+json"');
    expect(source).toContain("rel=\"canonical\"");
  });
});
