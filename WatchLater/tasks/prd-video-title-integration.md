# PRD — YouTube Summary Title-Based File Naming

## 1. Introduction / Overview
Switch summary and transcript storage from raw video IDs to human-readable, title-based filenames enriched with YouTube metadata. This improves discoverability, usability, and parity between the UI, exports, and automation that scan the `exports/` directory.

## 2. Goals
- Serve filenames that combine sanitized YouTube titles with timestamps for both transcripts and summaries.
- Surface video metadata (title, author, thumbnail) in the UI without adding new paid APIs.
- Maintain backward compatibility for pre-existing videoId-based files.

## 3. User Stories
| ID    | As a…            | I want to…                                           | So that…                                      |
|-------|------------------|-------------------------------------------------------|-----------------------------------------------|
| VT-1  | knowledge worker | See readable filenames for saved transcripts/summaries| I can identify the right asset quickly.       |
| VT-2  | archivist        | Automatically sanitize titles during export          | My filesystem stays organized and conflict-free. |
| VT-3  | developer        | Access video metadata from the backend API           | I can reuse it for UI display and automation. |

## 4. Functional Requirements
1. Provide `GET /api/video-metadata/:videoId` that wraps YouTube oEmbed and returns `{ title, author, thumbnail }`.
2. Sanitize raw titles to remove disallowed filesystem characters, trim whitespace, and cap length at 150 characters.
3. Generate filenames using the sanitized title plus type/timestamp for transcripts and summaries (`{title}-transcript-{timestamp}.txt`, `{title}-summary-{timestamp}.md`).
4. Update transcript and summary save flows (client + server) to use title-based filenames while preserving fallback to pure videoId.
5. Display metadata (title, author, thumbnail) in the UI where summaries and transcripts are shown.
6. Ensure existing entries using videoId remain accessible, downloadable, and upgradable.
7. Add tests covering sanitization helpers, filename generation, and metadata fetch error handling.

## 5. Non-Goals
- Re-architecting the transcript fetching mechanism (remains Supadata-based).
- Introducing persistent DB storage; continues using filesystem exports.
- Implementing localization for titles or metadata.

## 6. Design Considerations
- Maintain consistent typography when showing title/author metadata in the UI.
- Avoid truncation that hides meaningful parts of titles; prefer ellipsis in the middle when rendered.
- Preserve recognisable icons/thumbnails from the existing layout.

## 7. Technical Considerations
- Use YouTube oEmbed API (no API key) and set a descriptive `User-Agent`.
- Add a shared `sanitizeTitle` utility reusable by both server and client.
- Ensure filesystem writes prevent path traversal and log file creation results.
- Keep metadata caching minimal; fetch on demand with short in-memory cache if needed.

## 8. Success Metrics
- ≥ 95% of newly saved files use title-based filenames without manual intervention.
- Metadata fetch success rate ≥ 90% given public videos.
- Zero regression in download ability for legacy files (monitor bug reports).

## 9. Open Questions
- Should we persist metadata alongside files for offline use?
- Do we need user controls to rename files post-generation?
- How should we handle excessively long titles beyond 150 characters (e.g., add hash suffix)?

# Tasks 
## Relevant Files

- `server.js` - Hosts the `/api/video-metadata/:videoId` endpoint backed by YouTube oEmbed.
- `src/api.ts` - Fetches metadata from the backend and wires it into the client workflow.
- `src/utils.ts` - Generates sanitized filenames for transcripts and summaries.
- `shared/title-sanitizer.js` - Shared helper for stripping unsafe filesystem characters.
- `tests/video-title.test.ts` - Covers metadata fallbacks, sanitization, and filename generation.

### Notes

- Uses YouTube's free oEmbed API; no additional credentials needed.
- Fallback to raw videoId ensures backward compatibility for legacy exports.
- Metadata caching remains in-memory only; revisit if rate limits become an issue.

## Tasks

- [x] 1.0 Backend Metadata Endpoint
  - [x] 1.1 Implement `/api/video-metadata/:videoId` that wraps YouTube oEmbed.
  - [x] 1.2 Add request logging and defensive error handling for 404/429 responses.
  - [x] 1.3 Sanitize response payload before returning to the client.

- [x] 2.0 Title Sanitization Utilities
  - [x] 2.1 Create reusable `sanitizeTitle()` helper shared across server/client.
  - [x] 2.2 Strip illegal characters, collapse whitespace, and enforce max length (≤150 chars).
  - [x] 2.3 Add unit coverage for edge cases (emoji, punctuation, extremely long titles).

- [x] 3.0 Filename Generation
  - [x] 3.1 Implement `generateTranscriptFilename()` and `generateSummaryFilename()` helpers.
  - [x] 3.2 Update transcript/summary save flows to use sanitized titles + timestamps.
  - [x] 3.3 Ensure fallback to videoId when metadata is unavailable.

- [x] 4.0 UI Integration
  - [x] 4.1 Fetch metadata on video load and store alongside transcript/summary state.
  - [x] 4.2 Display title, author, and thumbnail within the history panels.
  - [x] 4.3 Refresh UI download controls to surface the new filenames.

- [x] 5.0 QA & Documentation
  - [x] 5.1 Verify end-to-end flow (metadata fetch → transcript save → summary save) with multiple public videos.
  - [x] 5.2 Update README/CHANGELOG documenting the naming convention change.
  - [x] 5.3 Monitor logs for metadata failures and document mitigation steps.
