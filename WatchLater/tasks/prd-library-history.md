# Library & Search (Local Index) PRD

## Introduction / Overview
The app stores many summary exports but lacks a dedicated view to browse prior results. This project delivers a lightweight "Library" view backed by a simple file index so users can quickly find saved summaries without introducing server-side databases. We keep the implementation minimal by reusing existing export metadata and limiting search to straightforward substring matching.

## Goals
- Provide a first-class UI to review saved summaries with basic metadata.
- Enable fast client-side filtering across title, hashtags, and preview text.
- Avoid introducing database infrastructure; reuse filesystem exports and a generated index.

## User Stories
- As a returning user, I want to open a History view that lists my saved summaries with titles and dates so I can scan recent work.
- As a user with many saved notes, I want to filter by keywords to find a specific video summary in under a second.
- As a user running batch jobs, I want to confirm that newly generated summaries appear in the Library without reloading the app.

## Functional Requirements
1. The server must maintain an `exports/index.json` file recording `{ videoId, title, filename, createdAt, modelId, charCount, hashtags }` for each saved summary.
2. `POST /api/save-summary` must create or update the index entry atomically when a summary is written to disk.
3. `POST /api/save-transcript` must upsert the same metadata when only a transcript is saved.
4. A new `GET /api/summaries` endpoint must return the index contents, falling back to scanning `exports/` when the index is missing.
5. The client must expose a "History" panel reachable from the main navigation, calling `GET /api/summaries` on open.
6. The History UI must render a sortable table showing title, created date, model, and length, plus a search input that filters rows using case-insensitive substring matching over title, hashtags, and the first 200 characters of the summary preview.
7. Selecting a row must open or highlight the existing summary detail view without duplicating content.
8. The History panel must display simple aggregate stats (total items, items added in last 7 days, most used model) only if the index provides the needed counts without extra queries.

## Non-Goals
- Writing or editing summaries from the History view.
- Advanced search features such as fuzzy matching, tag management, or multi-field filters.
- Persisting user-specific sort orders or custom columns.
- Real-time syncing between multiple clients.

## Technical Considerations
- Minimize filesystem churn by reading the existing index once per request; if the index is missing or corrupt, lazily rebuild it by walking `exports/` and rewrite the file.
- Use existing `fs.promises` utilities and ensure writes are serialized (e.g., `fs.writeFile` with temp file + rename) to prevent race conditions during batch jobs.
- Implement the History UI as a routed page that reuses current table/list components to avoid duplicating layout logic.
- Client-side filtering can operate on in-memory data; defer pagination until performance proves insufficient.

## Success Metrics
- Library view loads in under 300ms with 500 summaries on a modern laptop (measured locally).
- Searching for an existing keyword surfaces the correct summary within one keystroke latency (<100ms filter time).
- Zero reported incidents of missing summaries due to index corruption after 1 month of use.

## Open Questions
- Should we surface transcript-only entries, and if so, how do we differentiate them visually?
- Do we need to expose delete/archive controls, or is read-only sufficient for now?
