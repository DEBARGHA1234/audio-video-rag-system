export type * from "../drizzle/schema";
export * from "./_core/errors";

export type WorkspaceStatus = "operational" | "degraded" | "offline";
export type SourceKind = "PDF" | "DOCX" | "MD" | "CSV" | "JSON" | "URL" | "TXT" | "AUDIO" | "VIDEO";

export interface Citation {
  documentId: string;
  document: string;
  chunk: string;
  score: number;
  excerpt: string;
  chunkId?: string;
  startMs?: number;
  endMs?: number;
  speaker?: string;
  timestampLabel?: string;
  source?: string;
  sourceKind?: SourceKind;
  corrected?: boolean;
}

export interface MediaSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speaker: string;
  corrected: boolean;
}

export interface WorkspaceMetricSet {
  users: number;
  documents: number;
  queries: number;
  avgLatency: number;
  errorRate: number;
  dailyActiveUsers: number;
}
