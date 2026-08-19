import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getToolByRoute, isAiCreatorToolId, isDocumentUtilityToolId, isImageToolId, TOOL_REGISTRY } from "@/data/nexa";
import AiCreatorToolPage from "@/pages/AiCreatorToolPage";
import DocumentUtilityToolPage from "@/pages/DocumentUtilityToolPage";
import ImageToolPage from "@/pages/ImageToolPage";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ToolPlaceholder from "./pages/ToolPlaceholder";

/** Orbit Studio design reminder: NEXA is a dark-first, switchable product experience. */
const imageToolRoutes = TOOL_REGISTRY.filter((tool) => isImageToolId(tool.id));
const documentUtilityToolRoutes = TOOL_REGISTRY.filter((tool) => isDocumentUtilityToolId(tool.id));
const aiCreatorToolRoutes = TOOL_REGISTRY.filter((tool) => isAiCreatorToolId(tool.id));
const remainingToolRoutes = TOOL_REGISTRY.filter((tool) => !isImageToolId(tool.id) && !isDocumentUtilityToolId(tool.id) && !isAiCreatorToolId(tool.id));

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools" component={Home} />
      {imageToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={ImageToolRoute} />)}
      {documentUtilityToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={DocumentUtilityToolRoute} />)}
      {aiCreatorToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={AiCreatorToolRoute} />)}
      {remainingToolRoutes.map((tool) => <Route key={tool.id} path={tool.route} component={ToolPlaceholder} />)}
      <Route path="/pricing" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
