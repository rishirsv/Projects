# WatchLater Documentation Hub

Phase 3 introduces a full visual overhaul plus a hardened hybrid architecture. Use this hub to align design, engineering, and operations decisions.

---

## Architecture Overview (Phase 3)

```
repo-root/
├── docs/                  # PRD, UI briefs, assets
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

---

## Phase 3 UI Recap
- Gradient hero with pill input and trust badges (see `docs/ui-phase3-redesign.md`).
- Pipeline card shows four animated stages with live status icons.
- Summary surface renders markdown, key takeaways, tags, and transcript toggle.
- History drawer uses refreshed cards with timestamps/size metadata.

Screenshots referenced in README:
- `docs/assets/watchlater-hero.png`
- `docs/assets/watchlater-summary.png`

> Replace these PNGs after each visual iteration to keep marketing assets current.

---

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

---

## Reference Material
- `docs/prd-youtube-summarizer.md` – original product requirements document
- `docs/ui-phase3-redesign.md` – discovery notes, design tokens, textual mockups
- `tasks/tasks-prd-youtube-summarizer.md` – execution tracker (Phase 3 items now in progress)

---

## Screenshot Workflow
1. Run the app locally with a representative summary.
2. Capture hero + workspace states.
3. Export 1440px wide PNGs.
4. Drop into `docs/assets/` using the filenames referenced above.
5. Update README alt text if the story changes.

---

## Open Follow-ups
- Accessibility audit (contrast, focus outlines) – see task 14.1
- Cross-browser QA – task 14.2
- Cleanup pass on legacy utility classes once Tailwind decision is final (task 14.4)
