import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const accountSource = fs.readFileSync(path.resolve(import.meta.dirname, "Account.tsx"), "utf8");
const menuSource = fs.readFileSync(path.resolve(import.meta.dirname, "..", "components", "NexaAccountMenu.tsx"), "utf8");
const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "..", "App.tsx"), "utf8");

describe("authenticated account workspace", () => {
  it("registers a dedicated account route", () => {
    expect(appSource).toContain('<Route path="/account" component={Account} />');
  });

  it("uses server-verified billing and credit queries instead of client plan flags", () => {
    expect(accountSource).toContain("trpc.billing.status.useQuery");
    expect(accountSource).toContain("trpc.subscription.creditStatus.useQuery");
    expect(accountSource).toContain("redirectPath: \"/sign-in?returnTo=%2Faccount\"");
  });

  it("keeps account controls behind the authenticated profile menu", () => {
    expect(menuSource).toContain('setLocation("/account")');
    expect(menuSource).toContain('setLocation("/account#billing")');
    expect(menuSource).toContain("await logout()");
  });
});
