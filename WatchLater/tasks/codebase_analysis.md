# WatchLater Codebase Analysis

## 1. Project Overview
- Local-first YouTube summarization app pairing a Vite/React SPA with an Express file-backed API (`src/main.tsx:1`, `server.js:281`).
- Tech stack combines Node 20+ runtime expectations with React 19, Vite 7, and Express 5 as declared in project docs and dependencies (`README.md:29`, `package.json:7`, `package.json:19`, `package.json:23`).
- Architecture follows a two-tier pattern: the frontend orchestrates AI calls while the backend handles transcripts, persistence, and PDF export without a database (`README.md:91`, `server.js:833`, `server.js:1005`).
- Primary implementation languages are TypeScript on the client and modern ES modules on the server, with strict compiler settings (`tsconfig.app.json:4`, `server.js:1`).

## 2. Detailed Directory Structure Analysis
- `src/`: React application entrypoint and UI workflow. `src/App.tsx` orchestrates the summarization workflow while delegating presentational rendering to components in `src/components/` (`src/App.tsx:1`). `src/api.ts` centralizes fetch helpers, Gemini/OpenRouter adapters, and download utilities (`src/api.ts:1`). Context under `src/context` exposes model selection state across components (`src/context/model-context.tsx:1`).
- `server.js`: Single Express application that bootstraps directories, enforces metadata parsing, and defines REST endpoints for metadata, transcripts, summaries, PDF exports, and deletion (`server.js:210`, `server.js:281`, `server.js:833`).
- `server/`: Supporting modules for rendering markdown to HTML and streaming PDFs via Puppeteer, encapsulating styles and renderer lifecycle management (`server/markdown-to-html.js:1`, `server/pdf-renderer.js:1`).
- `shared/`: Utilities shared between frontend and backend such as config resolution, environment detection, and title/content sanitizers to ensure consistent filenames and validation (`shared/config.js:1`, `shared/env.ts:1`, `shared/title-sanitizer.js:1`).
- `prompts/`: Markdown prompt templates used to seed AI requests; currently includes the base transcript prompt referenced by the API (`prompts/Youtube transcripts.md`, `server.js:545`).
- `exports/`: Filesystem storage for generated transcripts and summaries; directories are ensured at startup, making the file system the persistence layer (`server.js:198`).
- `tests/`: Jest + ts-jest suites spanning API contracts and PDF generation with shared environment setup (`tests/pdf-route.test.ts:1`, `tests/setup-env.js:1`).
- `docs/`: Contributor-facing guidance and workflows, including architecture notes for assistants and manual QA instructions (`docs/CLAUDE.md:1`, `docs/TEST_INSTRUCTIONS.md:1`).
- `tasks/`: Product requirement documents and issue write-ups used to guide feature planning.
- Root assets such as `start.sh` ease local orchestration, while `public/` and `dist/` host static assets and build output for the client (`start.sh:1`, `public/vite.svg`, `dist/index.html`).

## 3. File-by-File Breakdown
**Core Application Files**
- `server.js`: Express routes for health, metadata, transcripts, summaries, PDF downloads, OpenRouter proxy, and cleanup logic, relying on filesystem reads/writes and shared sanitizers (`server.js:281`, `server.js:295`, `server.js:384`, `server.js:833`, `server.js:1005`).
- `src/api.ts`: Client transport layer handling timeouts, abort signals, prompt retrieval, Gemini SDK usage, REST calls, and download helpers (`src/api.ts:1`, `src/api.ts:156`).
- `src/App.tsx`: Primary React orchestrator that coordinates URL validation, stage progress, model registry integration, downloads, and deletion flows while composing extracted presentational components (`src/App.tsx:1`, `src/App.tsx:149`).

**Configuration Files**
- `package.json`: Scripts for dev/build/test, dependency declarations for React, Express, Puppeteer, and testing libraries (`package.json:6`, `package.json:15`).
- `vite.config.ts`: Minimal configuration enabling React plugin support (`vite.config.ts:1`).
- `eslint.config.js`: Shared TypeScript/React lint setup with modern ESLint flat config (`eslint.config.js:1`).
- `tsconfig.json` (+ `tsconfig.app.json`, `tsconfig.test.json`): Project references with strict compiler options and separate test transpilation strategy (`tsconfig.json:1`, `tsconfig.app.json:4`, `tsconfig.test.json:4`).
- `.env.example`: Documents required environment variables for client and server contexts (`.env.example:1`).
- `jest.config.js`: ts-jest ESM preset with module mappers for CSS mocks and TypeScript config override (`jest.config.js:1`).
- `start.sh`: Convenience script to launch server and Vite dev server together, with signal trapping for cleanup (`start.sh:1`).

**Data Layer**
- No ORM or database models; the backend writes normalized Markdown/TXT files under `exports/` using synchronous fs APIs to persist state (`server.js:833`, `server.js:566`).
- Metadata parsing and filename derivation rely on shared sanitizers to maintain consistent naming (`shared/title-sanitizer.js:17`).

**Frontend/UI**
- `src/components/BatchImportModal.tsx`: Modal for bulk URL parsing, deduplication, and submission handling with accessibility considerations (`src/components/BatchImportModal.tsx:1`).
- `src/components/ModelSelector.tsx`: Lightweight select control bound to shared context for choosing AI providers (`src/components/ModelSelector.tsx:1`).
- Styling is managed through `App.css` and `index.css`, referenced by the main app entrypoints (`src/App.tsx:34`, `src/main.tsx:3`).

**Testing**
- PDF streaming and API contracts covered via Jest specs (`tests/pdf-route.test.ts:1`, `tests/api-model-selection.test.ts`).
- Test environment seeds global env variables to simulate runtime configuration (`tests/setup-env.js:3`).

**Documentation**
- `README.md`: Product positioning, goals, quick start, and high-level architecture diagrams (`README.md:1`, `README.md:91`).
- `docs/CLAUDE.md` and `docs/TEST_INSTRUCTIONS.md`: Deep dives for assistants and QA workflows (`docs/CLAUDE.md:1`, `docs/TEST_INSTRUCTIONS.md:1`).
- `CONTRIBUTING.md` and `SECURITY.md`: Contribution guardrails and security notes (`CONTRIBUTING.md:1`, `SECURITY.md:1`).

**DevOps & Tooling**
- No container or CI definitions present; developers rely on npm scripts/start.sh for orchestration (absence of `.github` workflows, emphasis on local scripts in `start.sh:1`).
- Puppeteer-powered PDF generation depends on Chromium availability, controlled via environment variables read in the renderer module (`server/pdf-renderer.js:1`).

## 4. API Endpoints Analysis
| Method | Path | Purpose | Key Details |
| --- | --- | --- | --- |
| GET | `/health` | Basic health check with Supadata configuration flag | Public, no auth (`server.js:286`). |
| GET | `/api/video-metadata/:videoId` | Fetch title/author/thumbnail via YouTube oEmbed | Validates ID, maps provider fields, handles 404/429 (`server.js:295`). |
| POST | `/api/transcript` | Retrieve transcript text from Supadata | Retries across preferred languages, surfaces rate-limit errors, requires Supadata key (`server.js:384`). |
| POST | `/api/save-transcript` | Persist transcript to filesystem | Sanitizes title, writes metadata header, returns filename (`server.js:566`). |
| GET | `/api/transcripts` | List saved transcripts | Aggregates filesystem stats for UI (`server.js:618`). |
| GET | `/api/transcript-file/:videoId` | Read latest transcript for a video | Strips metadata separator before returning text (`server.js:654`). |
| POST | `/api/summarize/:videoId` | Prepare transcript payload for frontend summarization | Returns transcript to client for AI call (`server.js:697`). |
| POST | `/api/openrouter/generate` | Proxy OpenRouter chat completions | Validates prompt/model, forwards headers, handles errors (`server.js:750`). |
| POST | `/api/save-summary` | Persist AI summary with metadata | Records model, author, and length in Markdown header (`server.js:833`). |
| GET | `/api/summaries` | List saved summaries | Parses metadata and reports stats (`server.js:905`). |
| GET | `/api/summary-file/:videoId` | Read latest summary Markdown | Exposes stored model ID for UI display (`server.js:957`). |
| GET | `/api/summary/:videoId/pdf` | Render latest summary to PDF | Uses markdown renderer + Puppeteer with timeout handling (`server.js:1005`). |
| DELETE | `/api/summaries` | Bulk delete summaries (optional transcripts) | Removes files and returns counts (`server.js:1166`). |
| DELETE | `/api/summary/:videoId` | Delete latest or all summaries for a video | Supports `?all=true` to remove every version (`server.js:1167`). |
| POST | `/api/generate-summary/:videoId` | Prepare transcript + prompt bundle | For client-side Gemini flows (`server.js:1170`). |

All endpoints are unauthenticated, CORS-enabled, and expect JSON payloads; responses generally include human-readable error messages.

## 5. Architecture Deep Dive
- **Request Lifecycle**: Frontend extracts a video ID, queries video metadata, requests a transcript, and calls Gemini/OpenRouter based on the selected model, then posts the resulting Markdown back for storage (`src/App.tsx:23`, `src/api.ts:122`, `server.js:295`, `server.js:384`, `server.js:833`).
- **Data Flow**: Filesystem storage acts as the source of truth; summaries and transcripts are saved with sanitized filenames and later served back to the UI (`shared/title-sanitizer.js:17`, `src/utils.ts:17`, `server.js:905`).
- **Shared Modules**: Both tiers import the same sanitization and config helpers to avoid divergence (“shared” directory), while React context provides a global model registry derived from environment variables (`shared/config.js:1`, `shared/env.ts:1`, `src/config/model-registry.ts:1`, `src/context/active-model-context.ts:1`).
- **PDF Rendering Pipeline**: Server renders Markdown to HTML with `markdown-it`, injects styling, then serializes to PDF through a bounded Puppeteer queue with concurrency/timeouts (`server/markdown-to-html.js:1`, `server/pdf-renderer.js:1`, `server.js:1005`).
<!-- Batch Processing removed: the app focuses on single‑URL summaries. -->

## 6. Environment & Setup Analysis
- Required environment variables documented for both client (`VITE_GEMINI_API_KEY`, `VITE_MODEL_OPTIONS`, `VITE_MODEL_DEFAULT`) and server (`SUPADATA_API_KEY`, `OPENROUTER_API_KEY`, ports/CORS) (`.env.example:5`, `.env.example:17`, `.env.example:25`).
- README instructs cloning, installing dependencies with `npm ci`, copying `.env.example`, and running `npm run server` plus `npm run dev` for local development (`README.md:31`, `README.md:39`, `README.md:42`).
- `start.sh` offers a scripted alternative that launches both services and traps interrupts for cleanup (`start.sh:3`, `start.sh:33`).
- Tests run via `npm test`, using ts-jest with a custom TypeScript project for test builds (`package.json:13`, `tsconfig.test.json:4`).
- No deployment tooling is included; distribution relies on Vite builds (`package.json:8`, `dist/index.html`).

## 7. Technology Stack Breakdown
- **Runtime**: Node.js 20+ requirement in documentation, leveraging native fetch and ES modules on the server (`README.md:29`, `server.js:1`).
- **Frontend**: React 19 with Vite 7, React Markdown for rendering, Lucide icons, and Google Generative AI SDK for client-side inference (`package.json:7`, `package.json:15`, `src/App.tsx:1`, `src/api.ts:1`).
- **Backend**: Express 5 with CORS, dotenv, and Puppeteer for PDF generation (`package.json:19`, `server.js:281`, `server/pdf-renderer.js:1`).
- **AI Integration**: Gemini calls run in-browser, OpenRouter requests proxied server-side, Supadata supplies transcripts (`src/api.ts:1`, `server.js:750`, `server.js:384`).
- **Storage**: Local filesystem directories `exports/summaries` and `exports/transcripts` hold artifacts; no relational/NoSQL database is used (`server.js:198`).
- **Build Tools**: TypeScript project references, ESLint flat config, Vite bundler, ts-jest for tests (`tsconfig.app.json:4`, `eslint.config.js:1`, `vite.config.ts:1`, `jest.config.js:1`).
- **Testing**: Jest with Node environment, CSS module mocks, and environment bootstrap (`jest.config.js:3`, `tests/setup-env.js:3`).

## 8. Visual Architecture Diagram
```text
┌────────────────────────┐      ┌──────────────────────┐      ┌─────────────────────────┐
│ Vite/React Frontend    │────▶│ Express API Server    │────▶│ Filesystem (exports/)   │
│ (Browser + Gemini SDK) │     │ (Supadata & OpenRouter│     │ summaries & transcripts │
│                        │◀────│ proxy + PDF renderer) │◀────│ + prompts & digests     │
└────────────────────────┘      └──────────────────────┘      └─────────────────────────┘
        │   ▲                          │   ▲                            │
        │   └──────┐                   │   └──────┐                     │
        │          │                   │          │                     │
        ▼          │                   ▼          │                     ▼
    LocalStorage   │             Shared Modules    │              Puppeteer / Markdown-It
 (Queue + prefs)   │      (config/env/title utils) │
```

## 9. Key Insights & Recommendations
- **Security Hardening**: CORS currently allows all origins (`server.js:281`); restrict to trusted hosts and add rate limiting before exposing the API publicly (`SECURITY.md:7`).
- **Filesystem I/O**: Synchronous `fs` operations inside request handlers can block the event loop under load (`server.js:878`); migrate to async `fs.promises` and consider batching writes.
- **UI Composition**: `src/App.tsx` now focuses on orchestration, with render-heavy sections extracted into memoized components under `src/components/`; continue monitoring for further feature-level splits if state management grows.
- **Environment Management**: Client-side exposure of `VITE_GEMINI_API_KEY` is documented but risky for production (`.env.example:5`); emphasize server-side proxies for sensitive providers and consider feature-flagging model access.
- **Operational Visibility**: No CI, lint, or test automation is configured; add GitHub Actions or similar to run `npm run lint` and `npm test` on pushes for baseline quality assurance (`package.json:9`).
