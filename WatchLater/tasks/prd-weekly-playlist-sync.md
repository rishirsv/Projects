# Weekly "To Summarize" Playlist Sync PRD

## Introduction / Overview
Manually copying weekly YouTube links is repetitive. This feature introduces a minimal server job that ingests an RSS playlist feed, detects new videos, and runs the existing transcript + summary pipeline automatically once per week. We keep scope manageable by storing state on disk, avoiding OAuth, and providing a manual trigger before investing in schedulers.

## Goals
- Fetch a configured YouTube playlist RSS feed and identify videos not yet processed.
- Reuse the current transcript and summary generation flow for each new video.
- Produce a weekly digest markdown file summarizing new content, with optional email delivery for future expansion.

## User Stories
- As a user maintaining a recurring playlist, I want the app to process new entries without pasting URLs manually.
- As a user checking weekly output, I want to read a digest file that links to each summary created in the latest sync.
- As a tester, I want to run the sync job on demand to verify configuration before scheduling it.

## Functional Requirements
1. Add environment variables `PLAYLIST_RSS_URL` (required) and `DIGEST_RECIPIENT` (optional) to the server configuration and `.env.example`.
2. Implement `GET /jobs/sync-rss` (and a corresponding CLI script) that:
   - Fetches the RSS feed, parses entries, and sorts them by published date.
   - Reads `exports/lastSync.json` (or similar) to determine the most recent processed publish date.
   - Filters entries newer than the saved timestamp.
3. For each new entry, run the existing transcript + summary pipeline, save outputs alongside standard exports, and append to the Library index.
4. After processing, write/update `exports/lastSync.json` with the newest publish timestamp and sync metadata (count, run date).
5. Generate `exports/digests/YYYY-WW.md` containing an intro, bullet list of processed videos with links, and the first paragraph of each summary.
6. If `DIGEST_RECIPIENT` is set, send the digest via the existing Nodemailer utility; otherwise skip email.
7. Expose the latest digest through the client (e.g., link in the Library or a simple "This Week" tab) so users can read it without leaving the app.

## Non-Goals
- Building a full scheduler or CRON UI; initial launch assumes manual trigger or external scheduler.
- Handling private playlists or OAuth-protected feeds.
- Deduplicating videos beyond playlist publish date comparison.

## Technical Considerations
- Use a lightweight RSS parser (existing dependency or small custom parser) to avoid adding heavy libraries.
- Treat RSS fetch failures as non-fatal: return an informative HTTP error without partial writes.
- When generating digests, reuse markdown helpers if available; otherwise build simple strings to keep dependencies minimal.
- Ensure summary generation respects existing model selection and prompt dials to maintain consistency with manual runs.

## Success Metrics
- Sync job completes end-to-end (fetch, process, digest) in under 10 minutes for a playlist of up to 15 new videos.
- No duplicate digests are created for the same ISO week.
- QA confirms the digest correctly lists all newly processed videos across three consecutive weekly runs.

## Open Questions
- Should we allow backfilling older weeks on first run, or limit to the latest week to stay lightweight?
- Do we need a UI surface to kick off the sync manually, or is a CLI/HTTP endpoint sufficient for now?
