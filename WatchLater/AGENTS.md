# AGENTS.md

## Project Overview

WatchLater is a local‑first YouTube summarizer built with a React frontend and an Express backend. A user pastes a YouTube URL, and the app extracts the video ID, fetches the transcript via the Supadata API (server‑side), calls Google’s Gemini model to produce a Markdown summary (client today; can be server‑side in hosting mode), and writes both the raw transcript (`.txt`) and the summary (`.md`) to `exports/`. A “Saved summaries” panel lists prior outputs.

## Task workflow for new work

When you (the agent) create **new tasks**, follow this three‑step workflow and reference the repo docs accordingly:

1. **Plan** — Read and use `plan.md` to outline scope, success criteria, risks, and guardrails.
2. **Generate tasks** — Use `generate-tasks.md` to produce a concrete, ordered task list with estimates and any dependencies.
3. **Process task list** — Execute tasks per `process-task-list.md`, updating status artifacts and producing verifiable outputs.

Always keep the artifacts produced by these steps in the PR description (or link to them) so other agents and humans can audit and continue the work.

## Setup commands

- Install deps (root): `npm install`
- Start backend (Express): `npm run server` (defaults to `:3001`)
- Start frontend (Vite): `npm run dev` (defaults to `:5173`)
- Build frontend: `npm run build`
- Run tests: `npm test`

**Environment**

- Server: `SUPADATA_API_KEY` (required), `NODE_ENV`.
- Client (dev only): `VITE_GEMINI_API_KEY` (exposed in bundle). In “hosting mode”, move Gemini calls server‑side and replace with `GEMINI_API_KEY` on the server.
- Optional: `VITE_API_URL` to override API base; otherwise use same‑origin `/api`.

## Repository layout (high‑level)

- `server.js` — Express routes: transcript fetch, metadata (YouTube oEmbed), save/read files under `exports/`.
- `src/` — React app (`main.tsx`, `App.tsx`), API helpers (`src/api.ts`), utilities (`src/utils.ts`), prompt loader.
- `prompts/` — Default summarization prompt (`Youtube transcripts.md`).
- `exports/` — Generated transcripts and summaries (file system storage).

## Code style & conventions

- TypeScript on the client; prefer functional components and hooks.
- Keep side‑effects in hooks or API layer (`src/api.ts`).
- Filenames for outputs must include `videoId` and sanitized title; reuse existing helpers from `src/utils.ts`.
- Prefer small, focused components over a single “god component.”

## Testing instructions

- Unit tests: filename helpers, videoId extraction, server validators.
- API tests: route handlers via `supertest` (transcript, save/read, summaries index).
- For PRs touching pipeline orchestration, add an integration test that stubs Supadata + Gemini and asserts the four stages complete (metadata → transcript → AI → save).

## Security & hosting notes

- Never commit secrets. Rotate any leaked keys immediately.
- If publicly hosted, **do not ship** a client‑side Gemini key; proxy via server (`POST /api/ai/summarize`) and store `GEMINI_API_KEY` on the server. Add CORS allowlist and basic rate‑limiting for `/api/ai/summarize` and `/api/transcript`.
- Validate `videoId` on the server with `^[A-Za-z0-9_-]{11}$`; reject others with 400.

## PR checklist for agents

- Title format: `[watchlater] <short description>`
- Include links to the artifacts from **Plan → Generate → Process**.
- Run `npm test` and fix all failures; run `npm run build` to confirm the client builds.
- Describe any schema/filename changes and provide a one‑off migration if needed.

## References for agents

- Patterns for AGENTS.md sections and expectations【https://agents.md/】
- Multi‑agent summarizer pipelines (extract → preprocess → summarize → evaluate)【https://raw.githubusercontent.com/AbdooMohamedd/Multi-Agent-YouTube-Summarizer-System/refs/heads/main/README.md】
