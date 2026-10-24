type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type UmamiWindow = Window & {
  umami?: {
    track: (eventName: string, properties?: AnalyticsProperties) => void;
  };
};

let initialized = false;

function readConfig() {
  const endpoint = String(import.meta.env.VITE_ANALYTICS_ENDPOINT ?? "").trim().replace(/\/$/, "");
  const websiteId = String(import.meta.env.VITE_ANALYTICS_WEBSITE_ID ?? "").trim();
  return endpoint && websiteId ? { endpoint, websiteId } : null;
}

export function initAnalytics() {
  if (initialized || typeof document === "undefined") return;
  initialized = true;

  const config = readConfig();
  if (!config || document.querySelector('script[data-finemind-analytics="true"]')) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${config.endpoint}/umami`;
  script.dataset.websiteId = config.websiteId;
  script.dataset.finemindAnalytics = "true";
  document.head.appendChild(script);
}

export function trackEvent(eventName: string, properties?: AnalyticsProperties) {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as UmamiWindow;
  try {
    analyticsWindow.umami?.track(eventName, properties);
  } catch {
    // Analytics must never interrupt a tool, auth, or navigation flow.
  }
}

export function trackPageView(path: string) {
  trackEvent("page_view", { path });
}
