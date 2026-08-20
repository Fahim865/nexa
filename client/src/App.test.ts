import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

describe("application tool routing", () => {
  it("routes every registered browser-local text or calculator tool to LocalToolPage", () => {
    expect(appSource).toContain('const LocalToolPage = lazy(() => import("@/pages/LocalToolPage"));');
    expect(appSource).toContain("const localToolRoutes = TOOL_REGISTRY.filter((tool) => isLocalToolId(tool.id));");
    expect(appSource).toContain("return <LocalToolPage tool={tool} />;");
    expect(appSource).toContain("{localToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={LocalToolRoute} />)}");
    expect(appSource).toContain("const localToolAliasRoutes = localToolRoutes.filter((tool) => tool.route !== `/tools/${tool.id}`);");
    expect(appSource).toContain("{localToolAliasRoutes.map((tool) => <Route key={`${tool.id}-alias`} path={`/tools/${tool.id}`} component={LocalToolRoute} />)}");
  });
});
