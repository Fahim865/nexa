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
  nexaMediaProcessingEnabled: process.env.NEXA_MEDIA_PROCESSING_ENABLED === "true",
  premiumPriceUsd: process.env.PREMIUM_PRICE_USD ?? "",
  premiumMonthlyCredits: process.env.PREMIUM_MONTHLY_CREDITS ?? "",
  // Paddle Billing values are server-only. Never expose provider credentials or price IDs via VITE_ variables.
  nexaBillingProvider: process.env.NEXA_BILLING_PROVIDER ?? "none",
  paddleEnvironment: process.env.PADDLE_ENVIRONMENT ?? "",
  paddleApiKey: process.env.PADDLE_API_KEY ?? "",
  paddleMonthlyPriceId: process.env.PADDLE_MONTHLY_PRICE_ID ?? "",
  paddleAnnualPriceId: process.env.PADDLE_ANNUAL_PRICE_ID ?? "",
  paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
  paddleAppUrl: process.env.PADDLE_APP_URL ?? "",
  // Google OAuth / OIDC credentials are server-only. Never add a VITE_ prefix.
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
};
