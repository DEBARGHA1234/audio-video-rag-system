import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { askQuestion, getAdminMetrics, getEvaluations, getOverview, ingestSource, listDocuments, runEvaluation } from "./workspace";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    overview: publicProcedure.query(() => getOverview()),
    documents: publicProcedure.input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(6), search: z.string().default("") })).query(({ input }) => listDocuments(input.page, input.pageSize, input.search)),
    ingest: publicProcedure.input(z.object({ source: z.string().min(1).max(200000), name: z.string().max(240).optional(), kind: z.string().optional(), content: z.string().max(200000).optional(), size: z.number().optional() })).mutation(({ input }) => ingestSource(input)),
    ask: publicProcedure.input(z.object({ question: z.string().min(2).max(2000) })).mutation(({ input }) => askQuestion(input.question)),
    evaluations: publicProcedure.query(() => getEvaluations()),
    runEvaluation: publicProcedure.mutation(() => runEvaluation()),
    admin: publicProcedure.query(() => getAdminMetrics()),
  }),
});

export type AppRouter = typeof appRouter;
