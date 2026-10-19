import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  askQuestion,
  correctTranscriptSegment,
  getAdminMetrics,
  getActiveSession,
  getEvaluations,
  getSessionHistoryItem,
  getOverview,
  getSettings,
  getTranscript,
  ingestSource,
  listDocuments,
  listSessionHistory,
  reindexDocument,
  runEvaluation,
  transcribeSource,
  transcribeUploadedMedia,
  createNewSession,
  updateSettings,
} from "./workspace";

const mediaSegmentInput = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  text: z.string().min(1).max(20000),
  speaker: z.string().max(120).nullable().optional(),
  speakerLabel: z.string().max(120).nullable().optional(),
  speakerId: z.string().max(120).nullable().optional(),
  corrected: z.boolean().optional(),
});
const documentIdInput = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "documentId must be UUID-shaped");
const sessionIdInput = z.string().uuid("sessionId must be a UUID");

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
    session: publicProcedure.input(z.object({ sessionId: sessionIdInput.optional() }).default({})).query(({ input }) => getActiveSession(input.sessionId)),
    createSession: publicProcedure.input(z.object({ title: z.string().max(80).optional() }).default({})).mutation(({ input }) => createNewSession(input.title)),
    sessions: publicProcedure.input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(12) })).query(({ input }) => listSessionHistory(input.page, input.pageSize)),
    sessionHistoryItem: publicProcedure.input(z.object({ sessionId: sessionIdInput })).query(({ input }) => getSessionHistoryItem(input.sessionId)),
    documents: publicProcedure.input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(6), search: z.string().default("") })).query(({ input }) => listDocuments(input.page, input.pageSize, input.search)),
    ingest: publicProcedure.input(z.object({ source: z.string().min(1).max(200000), sessionId: sessionIdInput.optional(), name: z.string().max(240).optional(), kind: z.string().optional(), content: z.string().max(200000).optional(), size: z.number().optional(), mediaDurationMs: z.number().min(0).optional(), transcriptVersion: z.number().int().min(1).optional(), segments: z.array(mediaSegmentInput).max(10000).optional() })).mutation(({ input }) => ingestSource(input)),
    transcribe: publicProcedure.input(z.object({ audioUrl: z.string().url().max(2000), language: z.string().max(20).optional(), prompt: z.string().max(1000).optional() })).mutation(({ input }) => transcribeSource(input)),
    transcribeUpload: publicProcedure.input(z.object({ filename: z.string().min(1).max(240), mimeType: z.string().min(1).max(120), base64: z.string().min(1).max(36_000_000), language: z.string().max(20).optional(), prompt: z.string().max(1000).optional() })).mutation(({ input }) => transcribeUploadedMedia(input)),
    transcript: publicProcedure.input(z.object({ documentId: documentIdInput })).query(({ input }) => getTranscript(input.documentId)),
    correctTranscriptSegment: publicProcedure.input(z.object({ documentId: documentIdInput, segmentId: z.string().min(1).max(240), text: z.string().min(1).max(20000) })).mutation(({ input }) => correctTranscriptSegment(input)),
    reindex: publicProcedure.input(z.object({ documentId: documentIdInput })).mutation(({ input }) => reindexDocument(input.documentId)),
    ask: publicProcedure.input(z.object({ question: z.string().min(2).max(2000), sessionId: sessionIdInput.optional() })).mutation(({ input }) => askQuestion(input.question, input.sessionId)),
    evaluations: publicProcedure.query(() => getEvaluations()),
    runEvaluation: publicProcedure.mutation(() => runEvaluation()),
    admin: publicProcedure.query(() => getAdminMetrics()),
    settings: publicProcedure.query(() => getSettings()),
    updateSettings: publicProcedure.input(z.object({ topK: z.number().int().min(1).max(20), notifications: z.boolean(), answerCacheEnabled: z.boolean(), evaluationTelemetryEnabled: z.boolean(), theme: z.enum(["light", "dark"]).optional() })).mutation(({ input }) => updateSettings(input)),
  }),
});

export type AppRouter = typeof appRouter;
