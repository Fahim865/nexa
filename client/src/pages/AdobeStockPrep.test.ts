import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const prepSource = fs.readFileSync(path.resolve(import.meta.dirname, "AdobeStockPrep.tsx"), "utf8");
const registrySource = fs.readFileSync(path.resolve(import.meta.dirname, "..", "data", "nexa.ts"), "utf8");

describe("Adobe Stock Prep local workflow", () => {
  it("keeps the documented batch preparation constraints inside the client workspace", () => {
    expect(prepSource).toContain("const MAX_BATCH_FILES = 20");
    expect(prepSource).toContain("const MIN_PIXELS = 4_000_000");
    expect(prepSource).toContain("const MAX_FILE_BYTES = 45 * 1024 * 1024");
    expect(prepSource).toContain("Metadata is stripped");
  });

  it("offers truthful local exports without promising marketplace approval", () => {
    expect(prepSource).toContain("JSZip");
    expect(prepSource).toContain("Technical check only.");
    expect(prepSource).toContain("not an approval prediction");
    expect(prepSource).toContain("nexa-adobe-stock-technical-report.csv");
  });

  it("keeps metadata templates, duplicate detection and batch category actions browser-local", () => {
    expect(prepSource).toContain('const TEMPLATE_STORAGE_KEY = "nexa:adobe-stock-metadata-templates"');
    expect(prepSource).toContain("function findDuplicateKeywords(value: string)");
    expect(prepSource).toContain("Duplicate keyword");
    expect(prepSource).toContain("LOCAL METADATA TEMPLATES");
    expect(prepSource).toContain("BATCH CATEGORY PRESETS");
    expect(prepSource).toContain("Apply selected");
  });

  it("registers the workspace as an Image Tool at its direct route", () => {
    expect(registrySource).toContain('id: "adobe-stock-prep"');
    expect(registrySource).toContain('route: "/tools/adobe-stock-prep"');
    expect(registrySource).toContain('"adobe-stock-prep",');
  });
});
