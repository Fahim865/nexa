import { describe, expect, it, vi } from "vitest";

const createRoot = vi.hoisted(() => vi.fn(() => ({ render: vi.fn() })));

vi.mock("react-dom/client", () => ({ createRoot }));

import { getOrCreateReactRoot } from "./reactRoot";

describe("getOrCreateReactRoot", () => {
  it("reuses the existing root when the same host is bootstrapped again", () => {
    const host = {} as HTMLElement;

    const firstRoot = getOrCreateReactRoot(host);
    const secondRoot = getOrCreateReactRoot(host);

    expect(secondRoot).toBe(firstRoot);
    expect(createRoot).toHaveBeenCalledTimes(1);
  });
});
