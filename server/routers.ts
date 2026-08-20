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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
