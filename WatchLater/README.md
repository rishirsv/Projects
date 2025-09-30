# WatchLater — YouTube summaries in seconds

WatchLater turns any YouTube URL into a polished markdown brief using the AI model of your choice. Phase 3 delivers a Tactiq-inspired interface with glassmorphic cards, animated progress, and instant history recall—all running locally through a lightweight Node + React stack.

## System Overview
- Local-first architecture: Vite + React frontend orchestrates Gemini in-browser while an Express 5 server handles Supadata transcript fetches, OpenRouter proxying, and filesystem persistence (`src/main.tsx`, `server.js`).
- Filesystem storage is the source of truth. Summaries and transcripts live under `exports/` with title-aware filenames, and the PDF pipeline renders Markdown via `markdown-it` + Puppeteer.
- Shared utilities in `shared/` keep configuration, environment resolution, and sanitization consistent between client and server modules.
- Batch import capability has been removed. The app focuses on fast, reliable single‑URL summaries.

## Product Goals & User Stories
### Goals
- Deliver a readable video summary within 10 seconds of pasting a valid URL.
- Keep setup friction low so a fresh clone is running in under three minutes.
- Persist summaries locally using stable, greppable filenames for later reuse.
- Provide clear feedback paths when transcript fetches or AI calls fail.

### User Stories
| ID   | As a…     | I want to…                                    | So that…                           |
|------|-----------|------------------------------------------------|------------------------------------|
| US-1 | solo user | paste a YouTube link and click "Summarize"    | I get the main takeaways quickly.  |
| US-2 | solo user | have the summary saved locally as markdown    | I can grep, sync, or version it.   |
| US-3 | solo user | see actionable errors when processing fails   | I know why a video could not work. |

## Success Metrics
| Metric                        | Target       |
|-------------------------------|--------------|
| Summary response time         | ≤ 10 seconds |
| Setup time (clone to running) | ≤ 3 minutes  |
| Transcript fetch success rate | ≥ 85%        |
| Frontend bundle size          | ≤ 200 KB     |

## Quick Start

> Prereqs: Node.js 20+, npm 10+, macOS/Linux/WSL. No external services required beyond your own API keys.

```bash
# 0) Clone and install (downloads Chromium for PDF export)
npm ci

# 1) Create your env file
cp .env.example .env
# Then edit .env and paste your keys

# 2) Start the API server (port 3001)
npm run server

# 3) In a second terminal, start the web app (Vite on 5173)
npm run dev

# Optional: from the monorepo root (`Code/Projects`), the same commands are
# proxied via the root package.json, so `npm run start` will launch both
# processes without an extra `cd`.
```

Open http://localhost:5173 and paste a YouTube URL.

### Environment variables
Create `.env` at the repo root (see `.env.example`):

```env
# Client-side (exposed in browser; local use only)
VITE_GEMINI_API_KEY=...
VITE_MODEL_OPTIONS=gemini-2.5-flash|Gemini 2.5 Flash,openrouter/openai/gpt-4o-mini|GPT-4o Mini (OpenRouter),openrouter/x-ai/grok-4-fast:free|Grok 4 Fast (OpenRouter)
VITE_MODEL_DEFAULT=openrouter/openai/gpt-4o-mini

# Server-side (kept on backend)
SUPADATA_API_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_APP_URL=http://localhost:5173
OPENROUTER_APP_TITLE=WatchLater Summaries
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

`VITE_MODEL_OPTIONS` accepts comma-separated entries in the form `modelId|Label`; the label is optional but keeps the dropdown readable. `VITE_MODEL_DEFAULT` must match one of the provided model IDs. Adjust these values to surface Gemini, OpenRouter, Grok, or any other backends you have configured. The client injects the resolved environment at boot, so edits to `.env` only require a refresh.

`WatchLater/.gitignore` excludes `.env` and other secret-bearing files, so keep your real keys local and never commit them. Running `npm test` will fail if a Google API key pattern slips into tracked sources.

### Switching summarization models

The summary toolbar exposes a gradient "Model" selector beside the refresh button. The dropdown is populated from `VITE_MODEL_OPTIONS` at runtime, and the selected entry is kept in session storage (scoped to the active default) so you can iterate quickly when comparing providers. Gemini models run directly in the browser using `VITE_GEMINI_API_KEY`. Any `openrouter/...` model—including Grok 4—routes through the Express server with `OPENROUTER_API_KEY`, and the saved Markdown records the model used for easy auditing.

### Batch import
This release removes the batch import feature and associated queue UI. The app now focuses on fast, reliable single‑video summaries.

### Common scripts
- `npm run start` – run API + Vite together (dev)
- `npm run server` – Express API for transcripts, metadata, and saving
- `npm run dev` – Vite dev server
- `npm run build` – Type-check + production build
- `npm test` – Jest + ts-jest suite (`tests/`)

## Architecture & Data Flow
```
Frontend (Vite/React/TS)
  └── calls Express API @ localhost:3001
        ├── GET /api/video-metadata/:videoId  (YouTube oEmbed → title/author/thumbnail)
        ├── POST /api/transcript               (Supadata → transcript text)
        ├── POST /api/save-transcript          (writes exports/transcripts/*.txt)
        ├── POST /api/summarize/:videoId       (prepares prompt + transcript)
        ├── POST /api/save-summary             (writes exports/summaries/*.md)
        ├── GET  /api/transcripts|summaries    (lists saved files)
        ├── GET  /api/*-file/:videoId          (serves latest file by videoId)
        └── GET  /api/summary/:videoId/pdf     (Markdown → HTML → PDF stream)
```

1. User pastes URL → `extractVideoId()` finds the 11-character ID.
2. Client fetches `/api/video-metadata/:id` for title and thumbnail.
3. Client posts `/api/transcript` with `videoId`; server calls Supadata and returns plain text plus metadata.
4. Client saves transcript via `/api/save-transcript` (title-aware filename).
5. Client requests the prompt bundle and calls Gemini in-browser to generate Markdown.
6. Client saves summary via `/api/save-summary`.
7. User downloads Markdown or PDF; the PDF route renders the latest summary with `markdown-it` and Puppeteer.

#### API Surface
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Basic readiness probe exposing Supadata configuration state |
| GET | `/api/video-metadata/:videoId` | Fetch title, author, and thumbnail via YouTube oEmbed |
| POST | `/api/transcript` | Retrieve transcript text from Supadata with language fallbacks |
| POST | `/api/save-transcript` | Persist transcript file with metadata header |
| GET | `/api/transcripts` | List saved transcript files |
| GET | `/api/transcript-file/:videoId` | Return latest transcript content for a video |
| POST | `/api/summarize/:videoId` | Package transcript for client-side AI processing |
| POST | `/api/openrouter/generate` | Proxy OpenRouter chat completions when using server-side models |
| POST | `/api/save-summary` | Persist Markdown summary and metadata |
| GET | `/api/summaries` | List saved summaries with derived titles/authors |
| GET | `/api/summary-file/:videoId` | Return latest summary Markdown |
| GET | `/api/summary/:videoId/pdf` | Render latest summary to PDF via Puppeteer |
| DELETE | `/api/summaries` | Delete all summaries (and optional transcripts) |
| DELETE | `/api/summary/:videoId` | Delete latest or all summaries for a video |
| POST | `/api/generate-summary/:videoId` | Return transcript + prompt bundle for frontend Gemini runs |

### Storage Model
- `exports/transcripts/*.txt` – Transcript with a short frontmatter header.
- `exports/summaries/*.md` – Markdown summary keyed by `${videoId}__${sanitizedTitle}`.
- No database; filesystem storage is the source of truth.

### Design Considerations
- **Local-first**: everything runs on the contributor’s machine, including Gemini calls in the browser.
- **Title-aware filenames**: each summary pairs `videoId` with a sanitized title for human readability.
- **Thin backend**: Express proxies transcript fetches and handles file IO; summarization stays client-side.
- **Server-side PDF rendering**: a shared Puppeteer instance mirrors the React view for consistent exports.

### Known Limitations
- CORS defaults to open; tighten `ALLOWED_ORIGINS` before sharing beyond localhost.
- No auth or rate limiting—do not expose publicly as-is.
- Filename sanitization trims obvious hazards but can mis-handle typographic quotes; a refactor is planned.

### Repository Layout
| Path | Purpose | Key References |
| --- | --- | --- |
| `src/` | React application and model selector | `src/App.tsx`, `src/api.ts`, `src/components/` |
| `server.js` | Express entry point exposing transcript/summary/PDF routes and OpenRouter proxy | `server.js` |
| `server/` | Markdown → HTML renderer and Puppeteer PDF worker | `server/markdown-to-html.js`, `server/pdf-renderer.js` |
| `shared/` | Cross-tier utilities for config, env detection, sanitization | `shared/config.js`, `shared/env.ts`, `shared/title-sanitizer.js` |
| `exports/` | Filesystem persistence for transcripts and summaries (auto-created) | `exports/summaries/`, `exports/transcripts/` |
| `tests/` | Jest + ts-jest specs covering API and renderer flows | `tests/pdf-route.test.ts` |
| `docs/` | Contributor guides, QA playbooks, assistant instructions | `docs/CLAUDE.md`, `docs/TEST_INSTRUCTIONS.md` |
| `prompts/` | Markdown prompt templates served by the backend | `prompts/Youtube transcripts.md` |
| `start.sh` | Convenience script launching API and Vite dev server together | `start.sh` |

```
repo-root/
├── docs/
├── exports/
├── prompts/
├── server.js
├── server/
├── shared/
├── src/
├── tasks/
└── start.sh
```

## Technology Stack
- **Runtime**: Node.js 20+ with ES module support.
- **Frontend**: React 19, Vite 7, React Markdown, Lucide icons, Google Generative AI SDK.
- **Backend**: Express 5 with cors/dotenv helpers, Supadata transcript integration, OpenRouter proxy, and Puppeteer-based PDF rendering.
- **Storage**: Local filesystem directories `exports/summaries` and `exports/transcripts` managed by the server.
- **Build & Tooling**: TypeScript project references, ESLint flat config, Vite bundler, Jest + ts-jest for tests.

## Security & Performance Notes
- Restrict `cors()` to trusted origins via `ALLOWED_ORIGINS` and consider rate limiting before deploying beyond localhost.
- Synchronous `fs` writes inside request handlers (`server.js`) are simple but block the event loop; migrate heavy disk operations to `fs.promises` when scaling.
- `src/App.tsx` orchestrates state, effects, and handlers, while presentational components live under `src/components/` for maintainability and targeted testing.
- Guard client-exposed keys: Gemini must stay local-only, but OpenRouter or other sensitive providers should flow through server proxies.
- Add CI automation (lint + test) to catch regressions, mirroring the local commands documented above.

## Phase 3 UI Recap
- Gradient hero with pill input and trust badges (see `docs/ui-phase3-redesign.md`).
- Pipeline card shows four animated stages with live status icons.
- Summary surface renders markdown, key takeaways, tags, and transcript toggle.
- History drawer uses refreshed cards with timestamps/size metadata.
- Summary actions include Markdown + PDF downloads with inline status messaging.

Screenshots referenced in README:
- `docs/assets/watchlater-hero.png`
- `docs/assets/watchlater-summary.png`

> Replace these PNGs after each visual iteration to keep marketing assets current.

## Reference Material
- `docs/CLAUDE.md` – assistant setup + architecture snapshot
- `docs/prd-pdf-download.md` – requirements for the PDF export feature
- `docs/ui-phase3-redesign.md` – discovery notes, design tokens, textual mockups
- `docs/TEST_INSTRUCTIONS.md` – quick verification steps for summaries

## Screenshot Workflow
1. Run the app locally with a representative summary.
2. Capture hero + workspace states.
3. Export 1440px wide PNGs.
4. Drop into `docs/assets/` using the filenames referenced above.
5. Update README alt text if the story changes.

## Testing
- [Test Instructions](docs/TEST_INSTRUCTIONS.md)

## AI Assistant Config
- [Claude Instructions](docs/CLAUDE.md)

## Open Follow-ups
- Accessibility audit (contrast, focus outlines) – see task 14.1
- Cross-browser QA – task 14.2
- Cleanup pass on legacy utility classes once Tailwind decision is final (task 14.4)

## Troubleshooting
- **Blank page / console errors**: ensure both `npm run server` and `npm run dev` are running; missing APIs will halt the pipeline.
- **Supadata 401**: confirm `SUPADATA_API_KEY` in `.env`. Requests fail fast if the key is placeholder.
- **Supadata API key not configured**: copy `.env.example` to `.env`, add your real Supadata key, then restart `npm run server` so the backend picks up the change.
- **Gemini quota**: summaries depend on `VITE_GEMINI_API_KEY`; monitor Google AI Studio quotas for rate limiting.

## License
Internal project – do not distribute without permission.
