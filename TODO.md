# ContextCore media-grounding outcomes

- [x] **Timestamp-grounded answers:** Answers from audio/video sources expose start/end timestamps, source kind, and transcript excerpt in citations; the backend preserves timestamp metadata through chunking and the frontend renders clickable time chips.

- [x] **Speaker-aware transcript questions:** Transcription segments carry stable speaker labels when supplied by the transcription provider or an explicit diarization payload; questions can retrieve speaker-labeled evidence without inventing speaker names, and the UI shows speaker labels beside transcript citations. When no label is supplied, the UI uses `Unknown speaker` rather than fabricating an identity.

- [x] **Transcription correction workflow:** A user can edit a transcript segment, see the correction state, and save the corrected text without losing its original timestamp or speaker metadata.

- [x] **Re-indexing after correction:** Saving a correction creates a new transcript version, replaces the selected document's chunks, clears stale embeddings, preserves timestamp/speaker metadata, invalidates non-demo answer-cache entries for the workspace, and exposes processing/indexed/error states through the document record.

- [x] **Validation:** Existing routes remain response-compatible; `pnpm check`, `pnpm test`, `pnpm build`, a read-only transcript smoke test, and a cleaned Q&A canary passed without enabling the blocked Postgres runtime cutover.

## Current media limitation

Timestamped transcription is wired for server-readable audio/video URLs through the existing server-only transcription adapter. Local audio/video files are not uploaded by this increment; the workspace explains that a reachable media URL is required. Provider diarization fields are preserved when present, but the system does not invent speaker identities when the provider omits them.
