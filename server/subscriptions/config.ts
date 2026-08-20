const PREMIUM_PRICE_ENV_KEY = "PREMIUM_PRICE_USD";

export type PremiumCatalog = {
  monthlyPriceUsd: number;
  cadence: "month";
};

/**
 * Reads the intended Premium price in the server runtime only. This is pricing
 * metadata, not a payment or entitlement grant.
 */
export function getPremiumCatalog(): PremiumCatalog {
  const monthlyPriceUsd = Number(process.env[PREMIUM_PRICE_ENV_KEY]);

  if (!Number.isFinite(monthlyPriceUsd) || monthlyPriceUsd <= 0) {
    throw new Error(`${PREMIUM_PRICE_ENV_KEY} must be a positive USD amount.`);
  }

  return { monthlyPriceUsd, cadence: "month" };
}
