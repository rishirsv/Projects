# WatchLater — YouTube summaries in seconds

WatchLater turns any YouTube URL into a polished markdown brief using Gemini 2.5 Flash. Phase 3 delivers a Tactiq-inspired interface with glassmorphic cards, animated progress, and instant history recall—all running locally through a lightweight Node + React stack.

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
VITE_MODEL_OPTIONS=gemini-2.5-flash|Gemini 2.5 Flash,openrouter/google/gpt-4o-mini|GPT-4o Mini (OpenRouter)
VITE_MODEL_DEFAULT=gemini-2.5-flash

# Server-side (kept on backend)
SUPADATA_API_KEY=...
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

`VITE_MODEL_OPTIONS` accepts comma-separated entries in the form `modelId|Label`; the label is optional but keeps the dropdown readable. `VITE_MODEL_DEFAULT` must match one of the provided model IDs. Adjust these values to surface Gemini and OpenRouter endpoints that you have configured.

`WatchLater/.gitignore` excludes `.env` and other secret-bearing files, so keep your real keys local and never commit them. Running `npm test` will fail if a Google API key pattern slips into tracked sources.

### Switching summarization models

The summary toolbar exposes a gradient "Model" selector beside the refresh button. The dropdown is populated from `VITE_MODEL_OPTIONS` at build time, and the selected entry is kept in session storage so you can iterate quickly when comparing providers. Each summary request forwards the `modelId` to the backend, and the saved Markdown file records the model used for easy auditing.

### Batch import workflow
- Tap the **Batch Import** pill in the toolbar to open a modal that accepts up to ten YouTube URLs at once. Paste freely—the input trims whitespace, deduplicates IDs, and blocks submission until at least one valid link remains.
- After submission, the history drawer shows one dashed card per queued video with live stage badges (Queued → Fetching metadata → Fetching transcript → Generating summary → Completed). Failed entries surface the error message and offer **Retry**/**Dismiss** controls.
- Single-video runs temporarily pause the batch processor; likewise, the modal is disabled while a manual summary is active so the Supadata/Gemini pipeline never double-books credentials.
- Queue state is persisted to `localStorage`. Refreshing the page mid-run rehydrates the cards, resumes processing automatically, and emits `[batch-import] …` telemetry logs in the dev console for quick ad-hoc monitoring.

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
```
repo-root/
├── docs/                  # PRD, design notes, UI assets
├── exports/               # Generated transcripts (.txt) & summaries (.md)
├── prompts/               # Prompt templates (Markdown)
├── server.js              # Express API proxy (Supadata + file IO)
├── server/                # Markdown renderer + Puppeteer helpers
├── src/                   # Vite/React frontend
│   ├── App.tsx            # Hero, pipeline, history drawer
│   ├── api.ts             # Client ↔ server bridge (fetch, save, metadata)
│   ├── App.css            # Glassmorphism system + layout
│   └── index.css          # Design tokens & global gradients
└── start.sh               # Launch Express + Vite together
```

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
- `docs/PRD.md` – current product requirements overview
- `docs/prd-pdf-download.md` – requirements for the PDF export feature
- `docs/batch-import-qa.md` – manual QA checklist for the batch import pipeline
- `docs/pdf-export.md` – operations guide, configuration flags, QA checklist
- `docs/ui-phase3-redesign.md` – discovery notes, design tokens, textual mockups
- `tasks/prd-pdf-download.md` – execution tracker for the PDF feature
- `tasks/prd-video-title-integration.md` – title-based file naming and metadata requirements
- `tasks/prd-batch-import.md` – development tracker for the batch import feature

## Screenshot Workflow
1. Run the app locally with a representative summary.
2. Capture hero + workspace states.
3. Export 1440px wide PNGs.
4. Drop into `docs/assets/` using the filenames referenced above.
5. Update README alt text if the story changes.

## Testing
- [Test Instructions](docs/TEST_INSTRUCTIONS.md)

## Handoff
- [Project Handoff](docs/handoff.md)

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
