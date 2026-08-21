import { describe, expect, it } from "vitest";

const required = [
  "NEXA_BILLING_PROVIDER",
  "PADDLE_ENVIRONMENT",
  "PADDLE_API_KEY",
  "PADDLE_MONTHLY_PRICE_ID",
  "PADDLE_ANNUAL_PRICE_ID",
  "PADDLE_WEBHOOK_SECRET",
  "PADDLE_APP_URL",
] as const;

function requiredEnvironment(key: typeof required[number]) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} must be configured as a server-only Paddle secret.`);
  return value;
}

async function fetchConfiguredPaddlePrice(priceId: string) {
  const response = await fetch(`https://sandbox-api.paddle.com/prices/${encodeURIComponent(priceId)}`, {
    headers: { Authorization: `Bearer ${requiredEnvironment("PADDLE_API_KEY")}` },
  });
  const body = await response.json().catch(() => ({})) as { data?: { id?: string }; error?: { detail?: string } };
  expect(response.ok, body.error?.detail ?? `Paddle API returned ${response.status}`).toBe(true);
  return body.data;
}

describe("configured Paddle sandbox secrets", () => {
  it("validates the server-only provider setup and both configured recurring prices", async () => {
    for (const key of required) requiredEnvironment(key);
    expect(requiredEnvironment("NEXA_BILLING_PROVIDER")).toBe("paddle");
    expect(requiredEnvironment("PADDLE_ENVIRONMENT")).toBe("sandbox");
    expect(new URL(requiredEnvironment("PADDLE_APP_URL")).origin).toBe("https://nexapremium-mpo86vkq.manus.space");

    const monthlyId = requiredEnvironment("PADDLE_MONTHLY_PRICE_ID");
    const annualId = requiredEnvironment("PADDLE_ANNUAL_PRICE_ID");
    const [monthly, annual] = await Promise.all([
      fetchConfiguredPaddlePrice(monthlyId),
      fetchConfiguredPaddlePrice(annualId),
    ]);

    expect(monthly?.id).toBe(monthlyId);
    expect(annual?.id).toBe(annualId);
  }, 20_000);
});
