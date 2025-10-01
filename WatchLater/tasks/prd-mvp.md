# PRD — YouTube Watch-Later Summarizer (Direct API MVP)

## 1. Overview
Build a minimal React app that directly processes YouTube URLs using youtube-transcript and Gemini API. The app fetches transcripts, sends them to Gemini for summarization, displays results in markdown, and saves summaries locally. This browser-based architecture requires no backend server while providing instant video summarization.

## 2. Goals
- Paste a YouTube URL and get a readable summary within 10 seconds via direct API calls.
- Frontend stays minimal (≈ 100 LOC) with all processing in browser.
- Automatically save the summary to a local markdown file named after the video ID.
- Use direct API integration to eliminate server dependencies.

## 3. User Stories
| ID   | As a…      | I want to…                                   | So that…                            |
|------|------------|----------------------------------------------|-------------------------------------|
| US-1 | solo user  | paste a YouTube link and click "Summarize"   | I get the main takeaways instantly. |
| US-2 | solo user  | have the summary saved locally as markdown   | I can grep, sync, or version it.    |
| US-3 | solo user  | get error feedback if transcript fails       | I understand why it didn't work.    |

## 4. Architecture Components

### Frontend (React App)
- **Input**: URL field + "Summarize" button
- **API Layer**: `src/api.ts` handles youtube-transcript + Gemini calls
- **Display**: `react-markdown` renders returned summary
- **Storage**: Save response to `/exports/summaries/{videoId}.md` via File System Access API

### Processing Pipeline
- **URL Parsing**: Extract video ID from YouTube URL
- **Transcript Fetch**: Use `youtube-transcript` package directly
- **AI Processing**: Send transcript + prompt template to Gemini 2.5 Flash
- **File Storage**: Save markdown summary to local filesystem

## 5. Functional Requirements

### Core Features
1. Accept standard YouTube URL input
2. Extract video ID from URL patterns
3. Fetch transcript using `youtube-transcript` package
4. Display loading state during processing
5. Inject transcript into prompt template from `/prompts/youtube-transcripts.md`
6. Send to Gemini 2.5 Flash API
7. Render returned markdown summary
8. Save summary to `/exports/summaries/{videoId}.md`
9. Handle errors (no transcript, API failures, etc.)

### Error Handling
- Show user-friendly messages for common failures
- Fallback behavior when transcript unavailable
- Network error recovery
- Invalid URL detection

## 6. Technical Implementation

### Frontend Stack
- **Framework**: Vite + React + TypeScript
- **Dependencies**: 
  - `youtube-transcript` for caption extraction
  - `@google/generative-ai` for Gemini API
  - `react-markdown` for rendering
- **Files**: `src/App.tsx` (UI), `src/api.ts` (processing logic)
- **Environment**: `.env` with `GEMINI_API_KEY`

### API Integration
- **youtube-transcript**: Direct package usage for transcript fetching
- **Gemini API**: HTTP requests to Google's generative AI endpoint
- **File System**: Browser File System Access API for local saves
- **Error boundaries**: Comprehensive error handling throughout pipeline

## 7. File Structure
```
repo-root/
├── docs/
│   ├── README.md
│   └── prd-youtube-summarizer.md
├── prompts/
│   └── youtube-transcripts.md     # AI prompt template
├── exports/
│   ├── summaries/                 # Auto-generated summaries (git-ignored)
│   └── transcripts/               # Auto-generated transcripts (git-ignored)
├── src/
│   ├── App.tsx                    # Main React component
│   ├── api.ts                     # YouTube + Gemini integration
│   └── utils.ts                   # URL parsing, file handling
├── .env                           # GEMINI_API_KEY
└── package.json
```

## 8. Success Metrics
| Metric                         | Target      |
|--------------------------------|-------------|
| Summary response time          | ≤ 10 seconds|
| Frontend bundle size           | ≤ 200kb     |
| Setup time (clone to running)  | ≤ 3 minutes |
| Transcript fetch success rate  | ≥ 85%       |

## 9. Implementation Steps
1. **Project Setup**: Initialize Vite + React + TypeScript
2. **Dependencies**: Install youtube-transcript, @google/generative-ai, react-markdown
3. **Core Logic**: Build transcript fetching and Gemini integration in api.ts
4. **UI Components**: Create minimal input/output interface in App.tsx
5. **File Handling**: Implement local markdown file saving
6. **Error Handling**: Add comprehensive error states and user feedback
7. **Testing**: Verify with various YouTube URLs and edge cases

## 10. Feature PRD Index

- `tasks/prd-video-title-integration.md` — Title-based file naming and metadata integration requirements.
- `tasks/prd-pdf-download.md` — PDF export workflow for saved summaries.

# Tasks

## Pre‑flight
- [ ] Create feature branch `feat/mvp-direct-mode` and run `npm ci && npm run lint && npm test -- --runInBand && npm run build`.

## Phase A — Direct Mode Flag
- [ ] Add `VITE_DIRECT_MODE=true|false` to `.env.example`; default `false`.
- [ ] In client boot, resolve runtime env and expose a `directMode` boolean.

## Phase B — Client‑Only Transcript Fetch
- [ ] Add optional client path using `youtube-transcript` (browser) to fetch transcript when `directMode` is true.
- [ ] Keep existing server path as default; preserve response normalization and errors.

## Phase C — Client‑Only Save (Optional)
- [ ] When `directMode` is true, add an option to save files via the File System Access API behind a UI toggle, in addition to current server save.
- [ ] Respect title‑based filenames; sanitize and timestamp consistently with server.

## Phase D — Prompt & Model
- [ ] Continue using Gemini in‑browser path (existing `@google/generative-ai` usage) with `VITE_GEMINI_API_KEY`.
- [ ] Ensure no server dependency in the happy path when `directMode` is enabled.

## Phase E — UI Surfacing
- [ ] Add a small badge in the header indicating “Direct Mode” when enabled, with tooltip explaining limitations.
- [ ] If transcript fetch fails client‑side due to CORS/age‑restrictions, fall back to server mode automatically with a toast.

## Phase F — Tests & Validation
- [ ] Unit: environment resolution, feature gating, and filename generation parity.
- [ ] Manual QA: run end‑to‑end in direct mode; verify no server calls for transcript/summary save when opted in.

## Rollout & Backout
- [ ] Single PR gated by feature flag; default off.
- [ ] Backout by disabling the flag; no code path exercised in production.

## Done When
- [ ] A user can summarize a public video fully in the browser with no server calls when `VITE_DIRECT_MODE=true`.
- [ ] File naming matches server convention; fallbacks keep UX resilient.
