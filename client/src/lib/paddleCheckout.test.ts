import { describe, expect, it } from "vitest";
import { requirePaddleClientConfig } from "./paddleCheckout";

describe("Paddle client-side checkout configuration", () => {
  it("accepts only an explicit Sandbox environment and a Sandbox client token", () => {
    const token = process.env.VITE_PADDLE_CLIENT_TOKEN;
    const environment = process.env.VITE_PADDLE_ENVIRONMENT;

    expect(() => requirePaddleClientConfig({
      VITE_PADDLE_ENVIRONMENT: environment,
      VITE_PADDLE_CLIENT_TOKEN: token,
    })).not.toThrow();

    const config = requirePaddleClientConfig({
      VITE_PADDLE_ENVIRONMENT: environment,
      VITE_PADDLE_CLIENT_TOKEN: token,
    });
    expect(config.environment).toBe("sandbox");
    expect(config.token.startsWith("test_")).toBe(true);
  });

  it("rejects an environment/token mismatch before Paddle.js can be loaded", () => {
    expect(() => requirePaddleClientConfig({
      VITE_PADDLE_ENVIRONMENT: "sandbox",
      VITE_PADDLE_CLIENT_TOKEN: "live_123456789012345678901234567",
    })).toThrow("must match the configured sandbox environment");
  });
});
