import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

describe("Vercel deployment boundary", () => {
  it("builds Vite static assets and keeps managed storage and API paths ahead of the SPA fallback", () => {
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8"));

    expect(config.framework).toBe("vite");
    expect(config.buildCommand).toBe("pnpm run build:vercel");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions).toBeUndefined();
    expect(config.rewrites).toEqual([
      {
        source: "/manus-storage/:path*",
        destination: "https://nexapremium-mpo86vkq.manus.space/manus-storage/:path*",
      },
      { source: "/api/:path*", destination: "/api/[...path]" },
      { source: "/(.*)", destination: "/index.html" },
    ]);
  });

  it("exports the shared Express app from Vercel Function entrypoints", () => {
    const appFactory = fs.readFileSync(path.join(projectRoot, "server", "_core", "app.ts"), "utf8");
    const apiIndex = fs.readFileSync(path.join(projectRoot, "vercel", "function-entries", "index.ts"), "utf8");
    const apiCatchAll = fs.readFileSync(path.join(projectRoot, "vercel", "function-entries", "[...path].ts"), "utf8");

    expect(appFactory).toContain("export function createApp()");
    expect(appFactory).toContain('"/api/trpc"');
    expect(apiIndex).toContain("export default app");
    expect(apiCatchAll).toContain("export default app");
    expect(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")).toContain("build:vercel:functions");
  });

  it("approves only the required native build dependencies for pnpm installs", () => {
    const workspaceConfig = fs.readFileSync(path.join(projectRoot, "pnpm-workspace.yaml"), "utf8");

    expect(workspaceConfig).toContain("allowBuilds:");
    expect(workspaceConfig).toContain('"@tailwindcss/oxide": true');
    expect(workspaceConfig).toContain("esbuild: true");
    expect(workspaceConfig).toContain("patchedDependencies:");
    expect(workspaceConfig).toContain("wouter@3.7.1: patches/wouter@3.7.1.patch");
    expect(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")).toContain('"packageManager": "pnpm@10.26.0"');
  });

  it("keeps the bundle-warning threshold aligned with the lazy-loaded PDF reader", () => {
    const viteConfig = fs.readFileSync(path.join(projectRoot, "vite.config.ts"), "utf8");
    const documentTool = fs.readFileSync(path.join(projectRoot, "client", "src", "pages", "DocumentUtilityToolPage.tsx"), "utf8");

    expect(viteConfig).toContain("chunkSizeWarningLimit: 600");
    expect(viteConfig).toContain('return "tool-registry"');
    expect(viteConfig).not.toContain("ui-vendor");
    expect(viteConfig).toContain('return "tanstack-query"');
    expect(viteConfig).toContain('return "trpc-client"');
    expect(documentTool).toContain('import("pdfjs-dist/legacy/build/pdf.mjs")');
    expect(documentTool).toContain("function loadPdfJs()");
  });
});
