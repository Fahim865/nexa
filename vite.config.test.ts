import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const viteConfigSource = readFileSync(new URL("./vite.config.ts", import.meta.url), "utf8");

describe("production bundling configuration", () => {
  it("keeps Vite's dependency graph intact instead of splitting React and UI packages manually", () => {
    expect(viteConfigSource).not.toContain("manualChunks");
    expect(viteConfigSource).toContain("emptyOutDir: true");
  });
});
