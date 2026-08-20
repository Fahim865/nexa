import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requirePremium = t.middleware(async opts => {
  const { ctx, next } = opts;
  const user = ctx.user;
  const subscriptionIsActive = user?.subscriptionStatus === "ACTIVE" || user?.subscriptionStatus === "TRIALING";
  const subscriptionHasNotEnded = !user?.subscriptionEndDate || user.subscriptionEndDate.getTime() > Date.now();

  if (!user || user.plan !== "PREMIUM" || !subscriptionIsActive || !subscriptionHasNotEnded) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Premium subscription required" });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

/** Use for AI and other server-billed capabilities; never trust a client plan flag. */
export const premiumProcedure = t.procedure.use(requireUser).use(requirePremium);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
