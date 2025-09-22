# PRD — Weekly Batch Summary via YouTube Playlist RSS (A2)
_Date: 2025-09-22_

## 1) Introduction / Overview
This feature automatically discovers **new videos** added to a **user‑chosen YouTube playlist** (not Watch Later) by polling the playlist’s **RSS feed** once per week. Newly discovered videos are **batch summarized** using the existing pipeline, and a **weekly email digest** is sent. A matching **web view** (“This Week”) shows the same set.

> Why RSS (A2)? It avoids OAuth complexity and is compliant. Limitation: RSS typically exposes only the latest page of items (e.g., ~15). That’s acceptable for weekly sync; backfill is out of scope.

**Goal:** “I add videos to my ‘To Summarize’ playlist; once a week I get a clean digest of summaries.”

## 2) Goals
- G1. Discover and summarize all **new** playlist items since the last sync.
- G2. Send a weekly **email digest** with titles, links, and summary snippets.
- G3. Provide a **web view** of the week’s additions.
- G4. Operate unattended on a schedule (cron/Cloud Scheduler).

## 3) User Stories
- As a user, I want to **assign a playlist** to track so the app knows where to look.
- As a user, I want the app to **detect only new videos** and **skip already processed** ones.
- As a user, I want a **weekly email** listing the summaries with links to open/download.
- As a user, I want to manually **Run Sync Now** to force a recheck outside the schedule.

## 4) Functional Requirements
1. The system **stores one or more YouTube playlist IDs** to track (start with 1; allow list).
2. The system fetches `https://www.youtube.com/feeds/videos.xml?playlist_id=<ID>` weekly.
3. The system **parses items** (videoId, title, publishedAt, channelTitle, link).
4. The system **diffs** items against a persistent store (`videoId` as key) to find **new** additions.
5. For each new item, the system **enqueues** a batch job: transcript → summary → save files.
6. The system **persists results** to the standard storage (exports/ or cloud bucket) and updates an index (`index.json` or DB) with { videoId, playlistId, addedAt, summaryPath }.
7. The system generates a **weekly HTML email digest** (title, channel, snippet, links) and sends it.
8. The system provides a **web view** “This Week” (same data as email) accessible from the app.
9. A **manual sync endpoint** triggers the same logic.
10. **Error handling:** unreachable feed, empty feed, invalid playlistId → log and continue; do not crash the batch.
11. **Config:** frequency (weekly default), playlist IDs, email recipient(s), max items per run (safety cap).

## 5) Non‑Goals (Out of Scope)
- Accessing **Watch Later** (blocked by API) or scraping YouTube site.
- Historical backfill beyond the latest RSS page.
- Multi‑user playlist management.

## 6) Design Considerations (UI/UX)
- Simple Settings view with fields: **Playlist ID(s)** (comma‑separated), **Email**, **Weekly day/time**, **Max items per run**.
- “Run Sync Now” button with last-run timestamp and result count.
- “This Week” shelf on the home page listing the week’s videos.

## 7) Technical Considerations
- Implement a **FeedFetcher** using `node-fetch` and a small XML→JSON parser.
- Persist seen `videoId`s in a durable **index** (local: `exports/index.json`; cloud: SQLite or GCS JSON).
- Reuse existing **batch pipeline**: transcript provider → summarizer → file writer.
- Email via **SES** (preferred) or SMTP (Nodemailer).
- Rate-limit feed fetch; set request timeout/retry.
- If multiple playlists are configured, merge items; keep per‑playlist attribution.

## 8) Success Metrics
- Weekly digest delivered within ±1 hour of scheduled time.
- ≥ 95% of new playlist items summarized successfully.
- Zero duplicate summaries for the same `videoId` in a week.

## 9) Open Questions
- Should we allow **multiple recipients** (comma‑separated)?
- Should we show **failures** in the digest (e.g., “No transcript available”)?
- For cloud mode, do we store index in **GCS JSON** or **SQLite**? (See Cloud Run PRD.)

---

## **Implementation Task List (Appended)**

### Relevant Files
- `server.js` — Add `/jobs/sync-rss`, queue integration, and email trigger.
- `src/api.ts` — Client call for “Run Sync Now”; This Week fetcher.
- `src/views/Settings.tsx` — Add playlistId(s), email, schedule controls.
- `src/views/ThisWeek.tsx` — New page/shelf to display weekly items.
- `src/lib/rss.ts` — RSS fetch & parse utility (new).
- `src/lib/indexStore.ts` — Abstraction around index (local JSON or cloud) (new).
- `src/lib/email.ts` — Email sender (SES/Nodemailer) (new).
- `tests/rss.test.ts` — Unit tests for feed parsing and diffing (new).

### Tasks
- [ ] 1.0 Add configuration for playlist IDs and email
  - [ ] 1.1 Create settings schema (playlistIds[], email, dayOfWeek, timeOfDay, maxItems)
  - [ ] 1.2 Persist settings locally (JSON) with future option to move to cloud
- [ ] 2.0 Implement RSS fetch & diff
  - [ ] 2.1 Build `lib/rss.ts` to fetch and parse playlist RSS
  - [ ] 2.2 Write diff by `videoId` using `lib/indexStore.ts`
- [ ] 3.0 Queue new items for batch processing
  - [ ] 3.1 For each new `videoId`, enqueue transcript→summary→save
  - [ ] 3.2 Update index with results (paths, timestamps)
- [ ] 4.0 Weekly digest email
  - [ ] 4.1 Build `lib/email.ts` with SES (env: SES creds) or SMTP
  - [ ] 4.2 Compose HTML digest (title, channel, snippet, links)
  - [ ] 4.3 Send to configured `email` after batch completes
- [ ] 5.0 UI hooks
  - [ ] 5.1 Settings view (fields + validation)
  - [ ] 5.2 “Run Sync Now” button calling `/jobs/sync-rss`
  - [ ] 5.3 “This Week” page pulling aggregated results
- [ ] 6.0 Tests
  - [ ] 6.1 Unit: RSS parsing (edge cases), diff logic
  - [ ] 6.2 Integration: `/jobs/sync-rss` happy path and failures
- [ ] 7.0 Ops
  - [ ] 7.1 Add scheduler (cron locally; Cloud Scheduler in cloud)
  - [ ] 7.2 Logging & alerts for failures

