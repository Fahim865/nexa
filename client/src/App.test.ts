import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

describe("application tool routing", () => {
  it("routes every registered browser-local text or calculator tool to LocalToolPage", () => {
    expect(appSource).toContain('const LocalToolPage = lazy(() => import("@/pages/LocalToolPage"));');
    expect(appSource).toContain("const localToolRoutes = TOOL_REGISTRY.filter((tool) => isLocalToolId(tool.id));");
    expect(appSource).toContain("return <TrackToolVisit tool={tool}><LocalToolPage tool={tool} /></TrackToolVisit>;");
    expect(appSource).toContain("{localToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={LocalToolRoute} />)}");
    expect(appSource).toContain("const localToolAliasRoutes = localToolRoutes.filter((tool) => tool.route !== `/tools/${tool.id}`);");
    expect(appSource).toContain("{localToolAliasRoutes.map((tool) => <Route key={`${tool.id}-alias`} path={`/tools/${tool.id}`} component={LocalToolRoute} />)}");
  });

  it("routes every registered Video & Audio Tool to the lazy-loaded MediaToolPage workspace", () => {
    expect(appSource).toContain('const MediaToolPage = lazy(() => import("@/pages/MediaToolPage"));');
    expect(appSource).toContain("const mediaToolRoutes = TOOL_REGISTRY.filter((tool) => isMediaToolId(tool.id));");
    expect(appSource).toContain("const mediaToolAliasRoutes = mediaToolRoutes.filter((tool) => tool.route !== `/tools/${tool.id}`);");
    expect(appSource).toContain("return <TrackToolVisit tool={tool}><MediaToolPage tool={tool} /></TrackToolVisit>;");
    expect(appSource).toContain("{mediaToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={MediaToolRoute} />)}");
    expect(appSource).toContain("{mediaToolAliasRoutes.map((tool) => <Route key={`${tool.id}-alias`} path={`/tools/${tool.id}`} component={MediaToolRoute} />)}");
  });

  it("keeps dedicated discovery, sign-in, and public legal routes available", () => {
    expect(appSource).toContain('path="/tools/all"');
    expect(appSource).toContain('path="/sign-in"');
    expect(appSource).toContain('path="/privacy"');
    expect(appSource).toContain('path="/terms"');
  });
});
