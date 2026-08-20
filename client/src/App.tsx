import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getToolByRoute, isAiCreatorToolId, isDocumentUtilityToolId, isImageToolId, isLocalToolId, TOOL_REGISTRY } from "@/data/nexa";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const AiCreatorToolPage = lazy(() => import("@/pages/AiCreatorToolPage"));
const DocumentUtilityToolPage = lazy(() => import("@/pages/DocumentUtilityToolPage"));
const ImageToolPage = lazy(() => import("@/pages/ImageToolPage"));
const LocalToolPage = lazy(() => import("@/pages/LocalToolPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PremiumPricing = lazy(() => import("@/pages/PremiumPricing"));
const ToolPlaceholder = lazy(() => import("@/pages/ToolPlaceholder"));

/** Orbit Studio design reminder: NEXA is a dark-first, switchable product experience. */
const imageToolRoutes = TOOL_REGISTRY.filter((tool) => isImageToolId(tool.id));
const documentUtilityToolRoutes = TOOL_REGISTRY.filter((tool) => isDocumentUtilityToolId(tool.id));
const aiCreatorToolRoutes = TOOL_REGISTRY.filter((tool) => isAiCreatorToolId(tool.id));
const localToolRoutes = TOOL_REGISTRY.filter((tool) => isLocalToolId(tool.id));
const localToolAliasRoutes = localToolRoutes.filter((tool) => tool.route !== `/tools/${tool.id}`);
const remainingToolRoutes = TOOL_REGISTRY.filter((tool) => !isImageToolId(tool.id) && !isDocumentUtilityToolId(tool.id) && !isAiCreatorToolId(tool.id) && !isLocalToolId(tool.id));

function ImageToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !isImageToolId(tool.id)) {
    return <NotFound />;
  }

  return <ImageToolPage tool={tool} />;
}

function DocumentUtilityToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !isDocumentUtilityToolId(tool.id)) {
    return <NotFound />;
  }

  return <DocumentUtilityToolPage tool={tool} />;
}

function AiCreatorToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !isAiCreatorToolId(tool.id)) {
    return <NotFound />;
  }

  return <AiCreatorToolPage tool={tool} />;
}

function LocalToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location) ?? localToolAliasRoutes.find((candidate) => location === `/tools/${candidate.id}`);

  if (!tool || !isLocalToolId(tool.id)) {
    return <NotFound />;
  }

  return <LocalToolPage tool={tool} />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06111e]" aria-busy="true" aria-label="Loading page" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tools" component={Home} />
        <Route path="/premium" component={PremiumPricing} />
        {imageToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={ImageToolRoute} />)}
        {documentUtilityToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={DocumentUtilityToolRoute} />)}
        {aiCreatorToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={AiCreatorToolRoute} />)}
        {localToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={LocalToolRoute} />)}
        {localToolAliasRoutes.map((tool) => <Route key={`${tool.id}-alias`} path={`/tools/${tool.id}`} component={LocalToolRoute} />)}
        {remainingToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={ToolPlaceholder} />)}
        <Route path="/pricing" component={PremiumPricing} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster theme="dark" richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
