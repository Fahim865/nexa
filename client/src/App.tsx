import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getToolByRoute, isAiCreatorToolId, isDocumentUtilityToolId, isImageToolId, isLocalToolId, isMediaToolId, TOOL_REGISTRY, type ToolDefinition } from "@/data/nexa";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { recordRecentTool } from "@/hooks/useRecentTools";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const AiCreatorToolPage = lazy(() => import("@/pages/AiCreatorToolPage"));
const DocumentUtilityToolPage = lazy(() => import("@/pages/DocumentUtilityToolPage"));
const ImageToolPage = lazy(() => import("@/pages/ImageToolPage"));
const LocalToolPage = lazy(() => import("@/pages/LocalToolPage"));
const MediaToolPage = lazy(() => import("@/pages/MediaToolPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PremiumPricing = lazy(() => import("@/pages/PremiumPricing"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const ToolPlaceholder = lazy(() => import("@/pages/ToolPlaceholder"));
const ToolIndex = lazy(() => import("@/pages/ToolIndex"));

/** Orbit Studio design reminder: NEXA is a dark-first, switchable product experience. */
const imageToolRoutes = TOOL_REGISTRY.filter((tool) => isImageToolId(tool.id));
const mediaToolRoutes = TOOL_REGISTRY.filter((tool) => isMediaToolId(tool.id));
const mediaToolAliasRoutes = mediaToolRoutes.filter((tool) => tool.route !== `/tools/${tool.id}`);
const documentUtilityToolRoutes = TOOL_REGISTRY.filter((tool) => isDocumentUtilityToolId(tool.id));
const aiCreatorToolRoutes = TOOL_REGISTRY.filter((tool) => isAiCreatorToolId(tool.id));
const localToolRoutes = TOOL_REGISTRY.filter((tool) => isLocalToolId(tool.id));
const localToolAliasRoutes = localToolRoutes.filter((tool) => tool.route !== `/tools/${tool.id}`);
const remainingToolRoutes = TOOL_REGISTRY.filter((tool) => !isImageToolId(tool.id) && !isMediaToolId(tool.id) && !isDocumentUtilityToolId(tool.id) && !isAiCreatorToolId(tool.id) && !isLocalToolId(tool.id));

function TrackToolVisit({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  useEffect(() => {
    recordRecentTool(tool.id);
  }, [tool.id]);

  return <>{children}</>;
}

function ImageToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !isImageToolId(tool.id)) {
    return <NotFound />;
  }

  return <TrackToolVisit tool={tool}><ImageToolPage tool={tool} /></TrackToolVisit>;
}

function MediaToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location) ?? mediaToolAliasRoutes.find((candidate) => location === `/tools/${candidate.id}`);

  if (!tool || !isMediaToolId(tool.id)) {
    return <NotFound />;
  }

  return <TrackToolVisit tool={tool}><MediaToolPage tool={tool} /></TrackToolVisit>;
}

function DocumentUtilityToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !isDocumentUtilityToolId(tool.id)) {
    return <NotFound />;
  }

  return <TrackToolVisit tool={tool}><DocumentUtilityToolPage tool={tool} /></TrackToolVisit>;
}

function AiCreatorToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !isAiCreatorToolId(tool.id)) {
    return <NotFound />;
  }

  return <TrackToolVisit tool={tool}><AiCreatorToolPage tool={tool} /></TrackToolVisit>;
}

function LocalToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location) ?? localToolAliasRoutes.find((candidate) => location === `/tools/${candidate.id}`);

  if (!tool || !isLocalToolId(tool.id)) {
    return <NotFound />;
  }

  return <TrackToolVisit tool={tool}><LocalToolPage tool={tool} /></TrackToolVisit>;
}

function RemainingToolRoute() {
  const [location] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool || !remainingToolRoutes.some((candidate) => candidate.id === tool.id)) {
    return <NotFound />;
  }

  return <TrackToolVisit tool={tool}><ToolPlaceholder /></TrackToolVisit>;
}

function ToolIndexRoute() {
  return <ToolIndex />;
}

function AllToolsRoute() {
  return <ToolIndex mode="all" />;
}

function PrivacyPolicyRoute() {
  return <LegalPage kind="privacy" />;
}

function TermsOfServiceRoute() {
  return <LegalPage kind="terms" />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06111e]" aria-busy="true" aria-label="Loading page" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tools/all" component={AllToolsRoute} />
        <Route path="/tools" component={ToolIndexRoute} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/premium" component={PremiumPricing} />
        <Route path="/welcome" component={Welcome} />
        <Route path="/privacy" component={PrivacyPolicyRoute} />
        <Route path="/terms" component={TermsOfServiceRoute} />
        {imageToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={ImageToolRoute} />)}
        {mediaToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={MediaToolRoute} />)}
        {mediaToolAliasRoutes.map((tool) => <Route key={`${tool.id}-alias`} path={`/tools/${tool.id}`} component={MediaToolRoute} />)}
        {documentUtilityToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={DocumentUtilityToolRoute} />)}
        {aiCreatorToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={AiCreatorToolRoute} />)}
        {localToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={LocalToolRoute} />)}
        {localToolAliasRoutes.map((tool) => <Route key={`${tool.id}-alias`} path={`/tools/${tool.id}`} component={LocalToolRoute} />)}
        {remainingToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={RemainingToolRoute} />)}
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
