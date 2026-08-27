import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { AiServiceError } from "./ai/provider";
import { aiRunInputSchema, aiToolSchemas, MEDIA_AI_TOOL_IDS, parseAiRequest } from "./ai/contracts";
import { runAiRequest } from "./ai/service";
import {
  CreditServiceError,
  getCreditStatusForUser,
  markAiCreditRequestSucceeded,
  refundAiCreditReservation,
  reserveAiCredits,
} from "./credits/service";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { premiumProcedure, publicProcedure, router } from "./_core/trpc";
import { getPremiumCatalog } from "./subscriptions/config";
import type { User } from "../drizzle/schema";
import { protectedProcedure } from "./_core/trpc";
import { billingCheckoutInputSchema, billingPortalInputSchema, billingSessionInputSchema } from "./billing/contracts";
import { BillingProviderError } from "./billing/provider";
import { cancelSubscriptionForUser, createCheckoutForUser, createPortalForUser, getBillingStatusForUser, verifyCheckoutForUser } from "./billing/service";
import { getMediaProcessingCapability } from "./media/service";
import { getGoogleAuthPublicStatus } from "./auth/google";

function toBillingTrpcError(error: unknown): never {
  if (error instanceof BillingProviderError) {
    const code = error.code === "BILLING_NOT_CONFIGURED" ? "PRECONDITION_FAILED" : "BAD_REQUEST";
    throw new TRPCError({ code, message: error.message, cause: error });
  }
  throw error;
}

async function executeAiRequest(user: User, input: unknown) {
  const request = parseAiRequest(input);
  // Media analysis remains unavailable and is never charged until its secure pipeline exists.
  if (MEDIA_AI_TOOL_IDS.has(request.toolId)) return runAiRequest(request);

  let reservation: Awaited<ReturnType<typeof reserveAiCredits>> | null = null;
  try {
    reservation = await reserveAiCredits(user.id, request.toolId);
    const result = await runAiRequest(request);
    await markAiCreditRequestSucceeded(reservation, result.provider, result.model);
    return { ...result, credit: { charged: reservation.credits, remaining: reservation.remainingCredits } };
  } catch (error) {
    if (reservation) {
      try {
        await refundAiCreditReservation(reservation, error instanceof Error ? error.message : "AI provider request failed.");
      } catch (refundError) {
        console.error("[AI Credits] Failed to refund a provider failure", refundError);
      }
    }
    if (error instanceof CreditServiceError) {
      throw new TRPCError({ code: error.code, message: error.message, cause: error });
    }
    if (error instanceof AiServiceError) {
      throw new TRPCError({ code: error.code, message: error.message, cause: error });
    }
    throw error;
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    googleStatus: publicProcedure.query(() => getGoogleAuthPublicStatus()),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
      return {
        success: true,
      } as const;
    }),
  }),

  subscription: router({
    /** Public display metadata only; this endpoint never grants entitlement. */
    catalog: publicProcedure.query(() => getPremiumCatalog()),
    creditStatus: premiumProcedure.query(({ ctx }) => getCreditStatusForUser(ctx.user.id)),
  }),

  /** Public, credential-free capability display. It never creates or accepts a media job. */
  media: router({
    processingCapability: publicProcedure.query(() => getMediaProcessingCapability()),
  }),

  billing: router({
    status: protectedProcedure.query(({ ctx }) => getBillingStatusForUser(ctx.user.id)),
    createCheckoutSession: protectedProcedure.input(billingCheckoutInputSchema).mutation(async ({ ctx, input }) => {
      try { return await createCheckoutForUser(ctx.user, input); } catch (error) { return toBillingTrpcError(error); }
    }),
    verifyCheckoutSession: protectedProcedure.input(billingSessionInputSchema).mutation(async ({ ctx, input }) => {
      try { return await verifyCheckoutForUser(ctx.user.id, input.sessionId); } catch (error) { return toBillingTrpcError(error); }
    }),
    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      try { return await cancelSubscriptionForUser(ctx.user); } catch (error) { return toBillingTrpcError(error); }
    }),
    createPortalSession: protectedProcedure.input(billingPortalInputSchema).mutation(async ({ ctx, input }) => {
      try { return await createPortalForUser(ctx.user, input.returnUrl); } catch (error) { return toBillingTrpcError(error); }
    }),
  }),

  // Premium authorization runs before input validation and provider dispatch.
  ai: router({
    run: premiumProcedure.input(aiRunInputSchema).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    translator: premiumProcedure.input(aiToolSchemas["ai-translator"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    hashtagGenerator: premiumProcedure.input(aiToolSchemas["ai-hashtag-generator"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    descriptionGenerator: premiumProcedure.input(aiToolSchemas["ai-description-generator"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    stockMetadataGenerator: premiumProcedure.input(aiToolSchemas["ai-stock-metadata-generator"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    youtubeSeoAssistant: premiumProcedure.input(aiToolSchemas["ai-youtube-seo-assistant"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    subtitleGenerator: premiumProcedure.input(aiToolSchemas["ai-subtitle-generator"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    videoAnalyzer: premiumProcedure.input(aiToolSchemas["ai-video-analyzer"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
    videoClipPlanner: premiumProcedure.input(aiToolSchemas["ai-video-clip-planner"]).mutation(({ ctx, input }) => executeAiRequest(ctx.user, input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
