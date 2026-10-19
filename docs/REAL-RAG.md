# Real RAG behavior

The previous implementation had four misleading paths: ordinary URLs were represented by a placeholder sentence, local audio/video files were rejected instead of uploaded, retrieval used a small keyword-overlap sample, and the answer path returned hardcoded demo answers when the managed LLM was unavailable. Those paths are removed.

The current pipeline behaves as follows:

1. A direct text URL is fetched from the server, cleaned, and rejected if it is not a readable text/HTML/JSON/XML response.
2. A direct audio/video URL is downloaded by the server and sent to the managed speech-to-text endpoint. Local audio/video files are uploaded to managed storage first, then transcribed from a signed URL. The service returns the actual transcript and timestamped segments; a failed transcription is shown as an error.
3. Transcript segments are indexed with their original start/end timestamps. Session retrieval is restricted to the current session’s linked sources. For media sessions, retrieval keeps both ranked matches and an ordered transcript-coverage window so broad questions such as “what topics were discussed?” do not depend on exact keyword overlap.
4. The answer is generated only by the managed LLM from the retrieved source excerpts. If the LLM is not configured, or returns no answer, the request fails visibly. There is no canned-answer fallback.
5. The answer response keeps the retrieved source citations, including timestamp metadata when present. The canary was verified against a real public speech recording: the speech service returned the actual JFK transcript and the answer was generated from that transcript with a timestamped citation.

## Explicit limitations

The current managed model catalog exposes chat and speech services but no documented embedding model. Therefore this increment does not claim to provide dense-vector semantic retrieval. It uses ranked lexical matching plus transcript coverage and an LLM grounded on those excerpts. A production vector path should be added only after selecting and configuring a real embedding provider/model, with stored embedding dimensions and an actual pgvector query.

Hosted video page URLs such as a YouTube watch page are not direct media files and are not downloaded as if they were. Use a directly fetchable audio/video URL or upload the media file. PDF and DOCX extraction is also not silently faked; the UI reports that those parsers are not enabled yet.
