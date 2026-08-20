import type { AiToolId } from "../ai/contracts";
import { ENV } from "../_core/env";

const PREMIUM_PRICE_ENV_KEY = "PREMIUM_PRICE_USD";
const PREMIUM_MONTHLY_CREDITS_ENV_KEY = "PREMIUM_MONTHLY_CREDITS";

/** Source of truth for server-side AI charging. UI values are display-only. */
export const AI_TOOL_CREDIT_COSTS = {
  "ai-translator": 1,
  "ai-hashtag-generator": 1,
  "ai-description-generator": 2,
  "ai-stock-metadata-generator": 3,
  "ai-youtube-seo-assistant": 2,
  "ai-subtitle-generator": 10,
  "ai-video-analyzer": 20,
  "ai-video-clip-planner": 50,
} as const satisfies Record<AiToolId, number>;

export const AI_REQUESTS_PER_USER_PER_MINUTE = 12;

export type PremiumCatalog = {
  monthlyPriceUsd: number;
  cadence: "month";
  monthlyCreditAllowance: number;
  toolCreditCosts: Record<AiToolId, number>;
};

function readPositiveInteger(value: string, key: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive whole number.`);
  }
  return parsed;
}

export function getPremiumMonthlyCreditAllowance() {
  return readPositiveInteger(ENV.premiumMonthlyCredits, PREMIUM_MONTHLY_CREDITS_ENV_KEY);
}

export function getAiToolCreditCost(toolId: AiToolId) {
  return AI_TOOL_CREDIT_COSTS[toolId];
}

/**
 * Reads the intended Premium price in the server runtime only. This is pricing
 * metadata, not a payment or entitlement grant.
 */
export function getPremiumCatalog(): PremiumCatalog {
  const monthlyPriceUsd = Number(ENV.premiumPriceUsd);

  if (!Number.isFinite(monthlyPriceUsd) || monthlyPriceUsd <= 0) {
    throw new Error(`${PREMIUM_PRICE_ENV_KEY} must be a positive USD amount.`);
  }

  return {
    monthlyPriceUsd,
    cadence: "month",
    monthlyCreditAllowance: getPremiumMonthlyCreditAllowance(),
    toolCreditCosts: { ...AI_TOOL_CREDIT_COSTS },
  };
}
