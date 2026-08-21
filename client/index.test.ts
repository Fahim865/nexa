import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("./index.html", import.meta.url), "utf8");

describe("production HTML shell", () => {
  it("contains exactly one document and one React root without leaked patch markers", () => {
    expect(indexHtml.match(/<!doctype html>/gi)).toHaveLength(1);
    expect(indexHtml.match(/id="root"/g)).toHaveLength(1);
    expect(indexHtml).not.toContain("@@");
  });
});
