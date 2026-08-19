import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { AiServiceError } from "./ai/provider";
import { aiRunInputSchema, aiToolSchemas } from "./ai/contracts";
import { runAiRequest } from "./ai/service";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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

  // Public by product requirement. A future rate-limit / billing layer can wrap this router without changing tool contracts.
  ai: router({
    run: publicProcedure.input(aiRunInputSchema).mutation(({ input }) => executeAiRequest(input)),
    translator: publicProcedure.input(aiToolSchemas["ai-translator"]).mutation(({ input }) => executeAiRequest(input)),
    hashtagGenerator: publicProcedure.input(aiToolSchemas["ai-hashtag-generator"]).mutation(({ input }) => executeAiRequest(input)),
    descriptionGenerator: publicProcedure.input(aiToolSchemas["ai-description-generator"]).mutation(({ input }) => executeAiRequest(input)),
    stockMetadataGenerator: publicProcedure.input(aiToolSchemas["ai-stock-metadata-generator"]).mutation(({ input }) => executeAiRequest(input)),
    youtubeSeoAssistant: publicProcedure.input(aiToolSchemas["ai-youtube-seo-assistant"]).mutation(({ input }) => executeAiRequest(input)),
    subtitleGenerator: publicProcedure.input(aiToolSchemas["ai-subtitle-generator"]).mutation(({ input }) => executeAiRequest(input)),
    videoAnalyzer: publicProcedure.input(aiToolSchemas["ai-video-analyzer"]).mutation(({ input }) => executeAiRequest(input)),
    videoClipPlanner: publicProcedure.input(aiToolSchemas["ai-video-clip-planner"]).mutation(({ input }) => executeAiRequest(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
