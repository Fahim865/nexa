export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // NEXA provider credentials are intentionally server-only. Never add a VITE_ prefix.
  nexaAiProvider: process.env.NEXA_AI_PROVIDER ?? "disabled",
  nexaAiProviderApiKey: process.env.NEXA_AI_PROVIDER_API_KEY ?? "",
  nexaAiProviderBaseUrl: process.env.NEXA_AI_PROVIDER_BASE_URL ?? "",
  nexaAiModel: process.env.NEXA_AI_MODEL ?? "",
  // Media worker configuration is server-only. The client can query capability, never credentials.
  nexaMediaProcessor: process.env.NEXA_MEDIA_PROCESSOR ?? "disabled",
  nexaMediaWorkerUrl: process.env.NEXA_MEDIA_WORKER_URL ?? "",
  nexaMediaWebhookSecret: process.env.NEXA_MEDIA_WEBHOOK_SECRET ?? "",
  premiumPriceUsd: process.env.PREMIUM_PRICE_USD ?? "",
  premiumMonthlyCredits: process.env.PREMIUM_MONTHLY_CREDITS ?? "",
};
