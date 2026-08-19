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
};
