import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { AiServiceError } from "./ai/provider";
import { aiRunInputSchema, aiToolSchemas } from "./ai/contracts";
import { runAiRequest } from "./ai/service";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { premiumProcedure, publicProcedure, router } from "./_core/trpc";
import { getPremiumCatalog } from "./subscriptions/config";

async function executeAiRequest(input: unknown) {
  try {
    return await runAiRequest(input);
  } catch (error) {
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
  }),

  // Premium authorization runs before input validation and provider dispatch.
  ai: router({
    run: premiumProcedure.input(aiRunInputSchema).mutation(({ input }) => executeAiRequest(input)),
    translator: premiumProcedure.input(aiToolSchemas["ai-translator"]).mutation(({ input }) => executeAiRequest(input)),
    hashtagGenerator: premiumProcedure.input(aiToolSchemas["ai-hashtag-generator"]).mutation(({ input }) => executeAiRequest(input)),
    descriptionGenerator: premiumProcedure.input(aiToolSchemas["ai-description-generator"]).mutation(({ input }) => executeAiRequest(input)),
    stockMetadataGenerator: premiumProcedure.input(aiToolSchemas["ai-stock-metadata-generator"]).mutation(({ input }) => executeAiRequest(input)),
    youtubeSeoAssistant: premiumProcedure.input(aiToolSchemas["ai-youtube-seo-assistant"]).mutation(({ input }) => executeAiRequest(input)),
    subtitleGenerator: premiumProcedure.input(aiToolSchemas["ai-subtitle-generator"]).mutation(({ input }) => executeAiRequest(input)),
    videoAnalyzer: premiumProcedure.input(aiToolSchemas["ai-video-analyzer"]).mutation(({ input }) => executeAiRequest(input)),
    videoClipPlanner: premiumProcedure.input(aiToolSchemas["ai-video-clip-planner"]).mutation(({ input }) => executeAiRequest(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
