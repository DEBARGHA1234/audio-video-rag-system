export type * from "../drizzle/schema";
export * from "./_core/errors";

export type WorkspaceStatus = "operational" | "degraded" | "offline";
export type SourceKind = "PDF" | "DOCX" | "MD" | "CSV" | "JSON" | "URL" | "TXT" | "AUDIO";

export interface Citation {
  documentId: string;
  document: string;
  chunk: string;
  score: number;
  excerpt: string;
}

export interface WorkspaceMetricSet {
  users: number;
  documents: number;
  queries: number;
  avgLatency: number;
  errorRate: number;
  dailyActiveUsers: number;
}
