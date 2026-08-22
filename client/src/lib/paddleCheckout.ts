import { initializePaddle } from "@paddle/paddle-js";

export type PaddleClientEnvironment = "sandbox" | "production";

export type PaddleClientConfig = {
  environment: PaddleClientEnvironment;
  token: string;
};

type EnvironmentSource = Record<string, string | undefined>;

const clientTokenPattern = /^(test|live)_[A-Za-z0-9]{27}$/;

/**
 * Paddle client-side tokens are intentionally public and may be embedded in the
 * frontend bundle. API keys and webhook secrets never pass through this module.
 */
export function requirePaddleClientConfig(source: EnvironmentSource = import.meta.env): PaddleClientConfig {
  const environment = source.VITE_PADDLE_ENVIRONMENT?.trim().toLowerCase();
  const token = source.VITE_PADDLE_CLIENT_TOKEN?.trim();

  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("VITE_PADDLE_ENVIRONMENT must be explicitly set to sandbox or production.");
  }

  if (!token || !clientTokenPattern.test(token)) {
    throw new Error("VITE_PADDLE_CLIENT_TOKEN must be a valid Paddle client-side token.");
  }

  const expectedPrefix = environment === "sandbox" ? "test_" : "live_";
  if (!token.startsWith(expectedPrefix)) {
    throw new Error(`Paddle client token must match the configured ${environment} environment.`);
  }

  return { environment, token };
}

export async function openPaddleTransactionCheckout(input: {
  transactionId: string;
  successUrl: string;
  email?: string;
}) {
  if (!/^txn_[A-Za-z0-9]+$/.test(input.transactionId)) {
    throw new Error("Paddle did not return a valid checkout transaction ID.");
  }

  const config = requirePaddleClientConfig();
  const paddle = await initializePaddle({ token: config.token, environment: config.environment });
  if (!paddle) throw new Error("Paddle checkout could not be loaded. Please refresh and try again.");

  paddle.Checkout.open({
    transactionId: input.transactionId,
    ...(input.email ? { customer: { email: input.email } } : {}),
    settings: {
      displayMode: "overlay",
      variant: "one-page",
      successUrl: input.successUrl,
    },
  });
}
