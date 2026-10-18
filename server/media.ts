import { createHash } from "node:crypto";

export type MediaSegmentInput = {
  id?: string | number;
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string | null;
  speakerLabel?: string | null;
  speakerId?: string | null;
  corrected?: boolean;
};

export type MediaSegment = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speaker: string;
  corrected: boolean;
};

export type MediaMetadata = {
  source: "media";
  segmentId: string;
  startMs: number;
  endMs: number;
  speaker: string;
  transcriptVersion: number;
  corrected: boolean;
  originalText?: string;
};

export function normalizeMediaSegments(input: unknown[]): MediaSegment[] {
  return input
    .map((value, index) => {
      const row = (value ?? {}) as Partial<MediaSegmentInput> & Record<string, unknown>;
      const startMs = Number(row.startMs ?? Number(row.start ?? 0) * 1000);
      const endMs = Number(row.endMs ?? Number(row.end ?? startMs / 1000) * 1000);
      const text = String(row.text ?? "").replace(/\s+/g, " ").trim();
      if (!text || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null;
      const rawSpeaker = row.speaker ?? row.speakerLabel ?? row.speakerId ?? row.speaker_id ?? row.speaker_label;
      return {
        id: String(row.id ?? row.segmentId ?? `segment-${index + 1}`),
        startMs: Math.max(0, Math.round(startMs)),
        endMs: Math.max(Math.round(startMs), Math.round(endMs)),
        text,
        speaker: typeof rawSpeaker === "string" && rawSpeaker.trim() ? rawSpeaker.trim() : "Unknown speaker",
        corrected: Boolean(row.corrected),
      } satisfies MediaSegment;
    })
    .filter((segment): segment is MediaSegment => Boolean(segment));
}

export function mediaChunkMetadata(segment: MediaSegment, transcriptVersion = 1): MediaMetadata {
  return {
    source: "media",
    segmentId: segment.id,
    startMs: segment.startMs,
    endMs: segment.endMs,
    speaker: segment.speaker,
    transcriptVersion,
    corrected: segment.corrected,
  };
}

export function getMediaMetadata(metadata: unknown): MediaMetadata | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = metadata as Partial<MediaMetadata> & { media?: Partial<MediaMetadata> };
  const media = value.source === "media" ? value : value.media;
  if (!media || media.source !== "media") return null;
  if (typeof media.segmentId !== "string" || typeof media.startMs !== "number" || typeof media.endMs !== "number") return null;
  return {
    source: "media",
    segmentId: media.segmentId,
    startMs: media.startMs,
    endMs: media.endMs,
    speaker: typeof media.speaker === "string" && media.speaker ? media.speaker : "Unknown speaker",
    transcriptVersion: Number(media.transcriptVersion ?? 1),
    corrected: Boolean(media.corrected),
    ...(typeof media.originalText === "string" ? { originalText: media.originalText } : {}),
  };
}

export function formatTimestamp(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimestampRange(metadata: MediaMetadata) {
  return `${formatTimestamp(metadata.startMs)}–${formatTimestamp(metadata.endMs)}`;
}

export function stableTranscriptHash(segments: MediaSegment[]) {
  return createHash("sha256").update(segments.map(segment => `${segment.id}|${segment.startMs}|${segment.endMs}|${segment.speaker}|${segment.text}`).join("\n")).digest("hex");
}
