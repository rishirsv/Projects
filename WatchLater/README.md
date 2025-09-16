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

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cat <<'ENV' > .env
VITE_GEMINI_API_KEY=your_gemini_key
SUPADATA_API_KEY=your_supadata_key
ENV

# 3. Launch both servers (Express + Vite)
./start.sh            # or: npm run start
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001 (health check at `/health`)

### Useful scripts
- `npm run dev` – Vite dev server only
- `npm run server` – Express transcript proxy
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

### Server Endpoints
- GET `/health` – server status
- GET `/api/video-metadata/:videoId` – oEmbed title/author/thumbnail
- POST `/api/transcript` – fetch transcript via Supadata `{ videoId }`
- GET `/api/prompt` – load prompt template from `prompts/`
- POST `/api/save-transcript` – write transcript to `exports/transcripts/`
- POST `/api/save-summary` – write summary to `exports/summaries/`
- GET `/api/summaries` – list saved summaries; GET `/api/summary-file/:videoId` – read latest

## Phase 3 UI Recap
- Gradient hero with pill input and trust badges (see `docs/ui-phase3-redesign.md`).
- Pipeline card shows four animated stages with live status icons.
- Summary surface renders markdown, key takeaways, tags, and transcript toggle.
- History drawer uses refreshed cards with timestamps/size metadata.

Screenshots referenced in README:
- `docs/assets/watchlater-hero.png`
- `docs/assets/watchlater-summary.png`

> Replace these PNGs after each visual iteration to keep marketing assets current.

## Environment Setup
```bash
npm install
cat <<'ENV' > .env
VITE_GEMINI_API_KEY=your_gemini_key
SUPADATA_API_KEY=your_supadata_key
ENV
./start.sh
```

- `npm run start` mirrors `./start.sh`
- Express listens on `3001`; Vite on `5173`
- Health check: `curl http://localhost:3001/health`

### Security Model
- Gemini key stays in the browser; prompts and AI calls never hit the server.
- Transcript fetching happens on the server using your Supadata key.
- All files are written locally under `exports/` and never uploaded.

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
- **Gemini quota**: summaries depend on `VITE_GEMINI_API_KEY`; monitor Google AI Studio quotas for rate limiting.

## License
Internal project – do not distribute without permission.
