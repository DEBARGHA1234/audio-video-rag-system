# ContextCore completed outcomes

- [x] **Timestamp-grounded answers:** Answers from audio/video sources expose start/end timestamps, source kind, and transcript excerpt in citations; the backend preserves timestamp metadata through chunking and the frontend renders clickable time chips.

- [x] **Speaker-aware transcript questions:** Transcription segments carry stable speaker labels when supplied by the transcription provider or an explicit diarization payload; questions can retrieve speaker-labeled evidence without inventing speaker names, and the UI shows speaker labels beside transcript citations. When no label is supplied, the UI uses `Unknown speaker` rather than fabricating an identity.

- [x] **Transcription correction workflow:** A user can edit a transcript segment, see the correction state, and save the corrected text without losing its original timestamp or speaker metadata.

- [x] **Re-indexing after correction:** Saving a correction creates a new transcript version, replaces the selected document's chunks, clears stale embeddings, preserves timestamp/speaker metadata, invalidates non-demo answer-cache entries for the workspace, and exposes processing/indexed/error states through the document record.

- [x] **Active session continuity:** A new or resumed session has a stable ID, shows its title and activity state, and lets the user start a new session without losing the old one.

- [x] **Session-scoped media context:** Every audio/video URL or transcript ingested in the active session is linked to that session; questions in the session retrieve those sources and retain timestamp/speaker citations.

- [x] **History tab:** Older sessions appear in a dedicated History view with title, last activity, source count, message count, and forgotten/active status; opening an old session does not silently inject expired context.

- [x] **Gradual forgetting:** Inactive session messages expire after the configured 30-day retention horizon while session metadata and source history remain visible; forgotten context is excluded from retrieval and the UI explains how to resume with a fresh context.

- [x] **Validation:** `pnpm check`, `pnpm test`, `pnpm build`, live session-scoped ingest/ask/history smoke checks, RLS verification, and temporary-row cleanup all passed.

## Current media limitation

Timestamped transcription is wired for server-readable audio/video URLs through the existing server-only transcription adapter. Local audio/video files are not uploaded by this increment; the workspace explains that a reachable media URL is required. Provider diarization fields are preserved when present, but the system does not invent speaker identities when the provider omits them.
