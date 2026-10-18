import { describe, expect, it } from "vitest";
import { formatTimestampRange, getMediaMetadata, mediaChunkMetadata, normalizeMediaSegments, stableTranscriptHash } from "./media";

describe("media transcript normalization", () => {
  it("normalizes provider seconds into millisecond timestamps and preserves speaker labels", () => {
    const segments = normalizeMediaSegments([
      { id: 3, start: 1.25, end: 4.5, text: "  Hello   world ", speaker_label: "Speaker 1" },
      { startMs: 5000, endMs: 6500, text: "No label" },
    ]);

    expect(segments).toEqual([
      { id: "3", startMs: 1250, endMs: 4500, text: "Hello world", speaker: "Speaker 1", corrected: false },
      { id: "segment-2", startMs: 5000, endMs: 6500, text: "No label", speaker: "Unknown speaker", corrected: false },
    ]);
  });

  it("round-trips media chunk metadata and renders a grounded timestamp range", () => {
    const segment = normalizeMediaSegments([{ id: "s1", startMs: 3720000, endMs: 3728500, text: "Decision", speaker: "Speaker 2", corrected: true }])[0];
    const metadata = mediaChunkMetadata(segment, 4);

    expect(formatTimestampRange(metadata)).toBe("01:02:00–01:02:08");
    expect(getMediaMetadata({ media: metadata })).toMatchObject({ segmentId: "s1", speaker: "Speaker 2", transcriptVersion: 4, corrected: true });
  });

  it("changes the transcript hash when a correction changes the text", () => {
    const original = normalizeMediaSegments([{ id: "s1", startMs: 0, endMs: 1000, text: "old text", speaker: "Speaker 1" }]);
    const corrected = normalizeMediaSegments([{ id: "s1", startMs: 0, endMs: 1000, text: "new text", speaker: "Speaker 1", corrected: true }]);
    expect(stableTranscriptHash(original)).not.toBe(stableTranscriptHash(corrected));
  });
});
