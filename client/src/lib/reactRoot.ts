import { createRoot, type Root } from "react-dom/client";

type RootHost = HTMLElement & {
  __nexaReactRoot?: Root;
};

/**
 * Keeps the React root attached to the actual host element so a repeated module
 * bootstrap (for example, after an integration reload) renders through the
 * original root rather than constructing a second one for the same container.
 */
export function getOrCreateReactRoot(container: HTMLElement): Root {
  const host = container as RootHost;
  if (host.__nexaReactRoot) return host.__nexaReactRoot;

  const root = createRoot(container);
  Object.defineProperty(host, "__nexaReactRoot", {
    configurable: false,
    enumerable: false,
    value: root,
    writable: false,
  });

  return root;
}
