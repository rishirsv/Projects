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

## Architecture
```
repo-root/
├── docs/                  # PRD, design notes, UI assets
├── exports/               # Generated transcripts + summaries (gitignored)
├── prompts/               # Prompt templates consumed by the app
├── src/                   # React UI + client orchestration
│   ├── App.tsx            # Phase 3 hero/workspace UI
│   ├── api.ts             # Client ↔ Express helpers
│   ├── index.css          # Global tokens & gradients
│   └── App.css            # Component-level styling
├── server.js              # Express server (Supadata proxy + file persistence)
├── start.sh               # Convenience launcher for dev
└── tests/                 # Jest specs (naming, utilities)
```

## Phase 3 UI Snapshot (Sept 2025)
- Hero copy now highlights the Gemini pipeline and privacy benefits
- Processing grid walks through Metadata → Transcript → AI → Save with animated status icons
- Summary pane renders markdown via `react-markdown` and surfaces key takeaways, tags, and transcript toggle
- History drawer lists locally cached summaries with timestamps and quick actions

> 📸 Drop updated PNG exports into `docs/assets/` to keep the screenshots in this README fresh (`watchlater-hero.png`, `watchlater-summary.png`).

## Troubleshooting
- **Blank page / console errors**: ensure both `npm run server` and `npm run dev` are running; missing APIs will halt the pipeline.
- **Supadata 401**: confirm `SUPADATA_API_KEY` in `.env`. Requests fail fast if the key is placeholder.
- **Gemini quota**: summaries depend on `VITE_GEMINI_API_KEY`; monitor Google AI Studio quotas for rate limiting.

## License
Internal project – do not distribute without permission.
