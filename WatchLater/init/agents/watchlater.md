# WatchLater Agent Bootstrap

Leverage these quick facts from `tasks/codebase_analysis.md` when spinning up automation or assistant tasks inside the WatchLater app.

## Codebase Snapshot
- Local-first stack: Vite/React frontend (Gemini in-browser) + Express 5 backend on Node 20 (`src/`, `server.js`).
- Filesystem persistence only: transcripts and summaries live under `exports/` with sanitized filenames; PDFs render via `markdown-it` + Puppeteer (`server/`).
- Shared utilities in `shared/` expose config/env/title helpers consumed by both tiers.
- Batch import queue logic sits in `src/hooks/useBatchImportQueue.ts` and persists to `localStorage`.

## High-Value Files
| Role | Location |
| --- | --- |
| React workflow & stages | `src/App.tsx` |
| Client API + Gemini/OpenRouter helpers | `src/api.ts` |
| Express routes | `server.js` |
| Markdown → HTML renderer | `server/markdown-to-html.js` |
| PDF rendering worker | `server/pdf-renderer.js` |
| Sanitizers & env resolution | `shared/` |
| Jest suites | `tests/` |

## API Surface (server.js)
| Method | Path | Use |
| --- | --- | --- |
| GET | `/health` | Health check + Supadata flag |
| GET | `/api/video-metadata/:videoId` | YouTube oEmbed metadata |
| POST | `/api/transcript` | Supadata transcript fetch |
| POST | `/api/save-transcript` | Persist transcript file |
| GET | `/api/transcripts` | List transcripts |
| GET | `/api/transcript-file/:videoId` | Latest transcript |
| POST | `/api/summarize/:videoId` | Prep transcript for AI |
| POST | `/api/openrouter/generate` | Proxy OpenRouter |
| POST | `/api/save-summary` | Persist summary |
| GET | `/api/summaries` | List summaries |
| GET | `/api/summary-file/:videoId` | Latest summary |
| GET | `/api/summary/:videoId/pdf` | Render PDF |
| DELETE | `/api/summaries` | Delete all summaries (+ optional transcripts) |
| DELETE | `/api/summary/:videoId` | Delete by ID |
| POST | `/api/generate-summary/:videoId` | Prompt + transcript bundle |

## Operational Notes
- Restrict `cors()` origins and add rate limiting before deploying beyond localhost.
- Shift synchronous `fs` work in `server.js` to async APIs if throughput becomes an issue.
- Break apart `src/App.tsx` when implementing sizable UI features to avoid regressions.
- Keep Gemini keys browser-only; route other providers through the server proxy.
- Mirror local guardrails (`npm run lint`, `npm test`) in CI for automated checking.
