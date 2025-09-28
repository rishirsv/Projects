# PRD — YouTube Transcript Provider Migration (Supadata replacement, switchable)

Status: Draft v0 (assumptions) — will refine after clarifications.

## 1. Introduction / Overview
Replace the current Supadata-based transcript retrieval in the WatchLater backend with a local, zero‑key alternative using the `youtube-transcript` npm library. The design must be siloed, default to YouTube Transcript, and include an internal fallback to Supadata. It must also be switchable via a single environment flag so we can instantly force Supadata-only mode if needed without touching calling code or breaking the client contract.

Scope covers:
- A provider abstraction for transcript fetching.
- A new `youtube-transcript` provider implementation with basic language fallback.
- Extraction of existing Supadata logic into its own provider module.
- An orchestrated provider flow (YouTube Transcript → Supadata fallback) controlled by environment variables.
- Minimal surface changes to routes, especially `/api/transcript`, preserving response shape.

## 2. Goals
- Zero-cost operation: no external transcript API keys needed for default provider.
- Simple rollback: one env flip to revert to Supadata; no code changes.
- Maintain client/API compatibility: same response shape and error semantics.
- Keep code isolated: providers live in separate modules with a tiny, stable interface.
- Maintain or improve current success rate (target ≥ 85% across public videos) with automatic fallback.

## 3. User Stories
- As a solo user, I can fetch transcripts and generate summaries without configuring Supadata.
- As a developer, I can switch between providers via `.env` and restart the server.
- As QA, I can verify `/api/transcript` behaves identically regardless of provider.
- As a maintainer, I can troubleshoot provider-specific issues without impacting the other.

## 4. Functional Requirements
1. Add `TRANSCRIPT_PROVIDER` env var with allowed values: `auto` (default; try YouTube Transcript, then Supadata), `youtube` (force YouTube Transcript only), `supadata` (force Supadata only).
2. Implement a provider interface `fetchTranscript(videoId, options?)` returning a unified result:
   - On success: `{ outcome: 'success', transcript: string, metadata: { language: string, availableLangs: string[] } }`.
   - On empty: `{ outcome: 'empty', status?: number, message?: string, availableLangs?: string[] }`.
   - On error: `{ outcome: 'error', status?: number, message?: string, availableLangs?: string[] }`.
3. Extract current Supadata logic from `server.js` into `server/transcript-providers/supadata.js` to conform to the interface.
4. Add `server/transcript-providers/youtube-transcript.js` using the `youtube-transcript` npm lib:
   - Force language to `en-US` (per product decision). No additional language fallbacks.
   - Join segments into plain text and return length metadata.
5. Add a small provider registry `server/transcript-providers/index.js` that selects the provider at runtime using env vars.
6. Update `/api/transcript` to call the provider via the registry/orchestrator, preserving response JSON:
   - `{ success: true, videoId, transcript, length, language, availableLanguages }` on success.
   - Orchestrator behavior (when `TRANSCRIPT_PROVIDER=auto`):
     1) Try YouTube Transcript with `en-US`.
     2) On `empty` or `error`, try Supadata (default/no-lang or `en-US`).
     3) Return first success; otherwise map error to existing HTTP statuses (400, 404, 408, 429, 500, 502, 503) consistent with current behavior.
7. Extend `/health` JSON to include `{ transcriptProviderMode: 'auto'|'youtube'|'supadata', primary: 'youtube-transcript'|'supadata', fallback: 'supadata'|null }` while keeping existing `supadataConfigured` for compatibility.
8. Update `.env.example` with `TRANSCRIPT_PROVIDER` and keep `SUPADATA_API_KEY` as-is for rollback.
9. Logging: retain structured logs including provider attempts and final provider used for each request (no PII concerns). Recommended fields: `providerAttempt`, `providerUsed`, `durationMs`, `language`, `chars`.

## 5. Non-Goals
- OAuth/cookies handling for age-restricted/private videos.
- Replacing the playlist sync PRD; only note compatibility (RSS-based playlist fetch is separate work).
- Introducing additional providers (e.g., yt-dlp) at this time.

## 6. Design Considerations
- Silo providers in `server/transcript-providers/` to decouple implementation details from route handlers.
- Keep `server.js` thin: provider registry isolates any future additions (e.g., yt-dlp) behind the same interface.
- Preserve current API surface and file persistence flows in `exports/`.
- Favor small, dependency-light code for maintainability.

## 7. Technical Considerations
- ESM modules across server code; provider files should export ESM functions.
- Language: always request `en-US` from YouTube Transcript; do not implement additional language fallback.
- Performance: prefer in-process lib (no child processes), avoid blocking IO in hot paths.
- Testing: mock `youtube-transcript` in unit tests; provider integration tests don’t require network.
- Security: no secrets required for `YOUTUBE_TRANSCRIPT`; keep Supadata key server-only for rollback.

## 8. Success Metrics
- Transcript fetch success rate ≥ 85% on a sample set of public videos.
- `/api/transcript` median latency improves vs Supadata path (no network hop).
- 0 breaking changes in client; existing tests pass; provider-specific tests added.
- Rollback time ≤ 1 minute (env flip + restart).

## 9. Phased Implementation Plan
1. Provider interface & registry
2. Extract Supadata provider module
3. Implement youtube-transcript provider with lang fallback
4. Wire `/api/transcript` to registry (feature-flagged)
5. Extend `/health`; add env docs + `.env.example`
6. Add unit/integration tests; update README
7. Manual QA: sample URLs + batch import
8. Rollout: default `TRANSCRIPT_PROVIDER=auto` (YouTube → Supadata), include rollback instructions

- Set `TRANSCRIPT_PROVIDER=supadata` in `.env` and restart the server.
- No code revert required; `/api/transcript` contract unchanged.
- Keep Supadata provider code intact and tested.

## 11. Risks & Mitigations
- YouTube internal changes break `youtube-transcript`: retain Supadata provider as immediate fallback via env switch; add monitoring logs.
- Language mismatch returns empty content: attempt auto/no-lang after preferred list; return clear error when empty.
- Test fragility: mock external libs; avoid network during tests.

## 12. Testing Strategy
- Unit tests: provider interface behavior (success, empty, error); language fallback logic.
- Integration test: `/api/transcript` under each provider via env swap; ensure identical response shape.
- Regression: file save/delete flows remain unchanged; PDF route unaffected.

## 13. Documentation Updates
- README: Environment variables; transcript providers section; rollback instructions.
- `.env.example`: add `TRANSCRIPT_PROVIDER`, `TRANSCRIPT_LANGS`.
- `tasks/`: this PRD and diagram checked in with the feature branch.

## 14. Compatibility with Weekly Playlist Sync
- The provider abstraction is independent of how video IDs are sourced. The RSS-based playlist sync can call the same `/api/transcript` endpoint with the active provider, requiring no changes here.

## 15. Product Requirement Diagram (high-level)
```mermaid
flowchart LR
  A[Client /api/transcript] --> B{Mode\nTRANSCRIPT_PROVIDER}
  B -- auto --> C[Orchestrator]
  B -- youtube --> Y[youtube-transcript]
  B -- supadata --> S[Supadata]
  C -->|try 1| Y[youtube-transcript\n(lang: en-US)]
  Y -->|success| R[Response OK]
  Y -->|empty/error| S
  S -->|success| R
  S -->|error| E[Error mapping\n(404/429/5xx...)]
  R --> G[JSON response\n{ success, videoId, transcript, length, language, availableLanguages }]
  E --> G
```

## 16. Final Decisions (from clarifications)
- Default flow: Use YouTube Transcript with internal fallback to Supadata.
- Rollback: Support `TRANSCRIPT_PROVIDER=supadata` to force Supadata only.
- Language: Always attempt `en-US` for YouTube Transcript; do not implement other language fallbacks.
- Logging: Include provider attempts and final provider used; no PII constraints.
- Scope: Do not document or implement additional providers now.
