# WatchLater — YouTube summaries in seconds

![Tactiq-inspired hero](docs/assets/watchlater-hero.png)
![Summary workspace](docs/assets/watchlater-summary.png)

WatchLater turns any YouTube URL into a polished markdown brief using Gemini 2.5 Flash. Phase 3 delivers a Tactiq-inspired interface with glassmorphic cards, animated progress, and instant history recall—all running locally through a lightweight Node + React stack.

## Highlights
- ✨ **New UI system** – gradient hero, pill input, neon progress stages, refreshed history drawer
- ⚡ **End-to-end automation** – paste a URL, fetch transcript via Supadata, summarize with Gemini, auto-save markdown
- 💾 **Local-first storage** – transcripts and summaries land in `exports/` with title-aware filenames
- 🛡️ **Private by design** – transcripts are fetched server-side with your Supadata key; Gemini key stays in the browser

## Quick Start

> Prereqs: Node.js 20+, npm 10+, macOS/Linux/WSL. No external services required beyond your own API keys.

```bash
# 0) Clone and install
npm ci

# 1) Create your env file
cp .env.example .env
# Then edit .env and paste your keys

# 2) Start the API server (port 3001)
npm run server

# 3) In a second terminal, start the web app (Vite on 5173)
npm run dev
```

Open http://localhost:5173 and paste a YouTube URL.

### Environment variables
Create `.env` at the repo root (see `.env.example`):

```env
# Client-side (exposed in browser; local use only)
VITE_GEMINI_API_KEY=...

# Server-side (kept on backend)
SUPADATA_API_KEY=...
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

### Common scripts
- `npm run start` – run API + Vite together (dev)
- `npm run server` – Express API for transcripts, metadata, and saving
- `npm run dev` – Vite dev server
- `npm run build` – Type-check + production build
- `npm test` – Jest + ts-jest suite (`tests/`)

## Architecture Overview (Phase 3)

```
repo-root/
├── docs/                  # PRD, design notes, UI assets
├── exports/               # Generated transcripts (.txt) & summaries (.md)
├── prompts/               # Prompt templates (Markdown)
├── server.js              # Express API proxy (Supadata + file IO)
├── src/                   # Vite/React frontend
│   ├── App.tsx            # Hero, pipeline, history drawer
│   ├── api.ts             # Client ↔ server bridge (fetch, save, metadata)
│   ├── App.css            # Glassmorphism system + layout
│   └── index.css          # Design tokens & global gradients
└── start.sh               # Launch Express + Vite together
```

* **Frontend**: React 19 + Vite 7 with `react-markdown` for markdown rendering.
* **Backend**: Express 5 proxying Supadata transcripts, persisting files, serving prompt templates.
* **AI**: Gemini 2.5 Flash via `@google/generative-ai` directly from the browser (uses `VITE_GEMINI_API_KEY`).
* **Storage**: Filesystem writes to `exports/`, filenames prefixed with `videoId__title` for stable lookups.

## Phase 3 UI Recap
- Gradient hero with pill input and trust badges (see `docs/ui-phase3-redesign.md`).
- Pipeline card shows four animated stages with live status icons.
- Summary surface renders markdown, key takeaways, tags, and transcript toggle.
- History drawer uses refreshed cards with timestamps/size metadata.

Screenshots referenced in README:
- `docs/assets/watchlater-hero.png`
- `docs/assets/watchlater-summary.png`

> Replace these PNGs after each visual iteration to keep marketing assets current.

## Reference Material
- `docs/prd-youtube-summarizer.md` – original product requirements document
- `docs/ui-phase3-redesign.md` – discovery notes, design tokens, textual mockups
- `tasks/tasks-prd-youtube-summarizer.md` – execution tracker (Phase 3 items now in progress)

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
