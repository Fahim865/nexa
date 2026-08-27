import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

describe("Vercel deployment boundary", () => {
  it("builds Vite static assets and keeps API paths ahead of the SPA fallback", () => {
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8"));

    expect(config.framework).toBe("vite");
    expect(config.buildCommand).toBe("pnpm run build:vercel");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions).toBeUndefined();
    expect(config.rewrites).toEqual([
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
});
