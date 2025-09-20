## Relevant Files

- `package.json` - Project dependencies and scripts configuration
- `vite.config.ts` - Vite build configuration for React + TypeScript
- `tsconfig.json` - TypeScript configuration
- `src/main.tsx` - React app entry point
- `src/App.tsx` - Main React component with UI and state management
- `src/api.ts` - YouTube transcript fetching and Gemini API integration
- `src/utils.ts` - URL parsing and file handling utilities
- `src/types.ts` - TypeScript type definitions
- `.env` - Environment variables (GEMINI_API_KEY)
- `public/index.html` - HTML template
- `.gitignore` - Git ignore configuration
- `server.js` - Express API server to host the new PDF download route
- `server/pdf-renderer.js` - Helper to render markdown summaries to PDF with Puppeteer
- `server/markdown-to-html.js` - Shared markdown-it renderer to keep HTML consistent with the UI
- `tests/pdf-route.test.ts` - Integration tests that exercise the PDF endpoint
- `docs/prd-youtube-summarizer.md` - PRD source documenting the PDF export requirements
- `tasks/issues/google-api-key-exposed.md` - Security issue documenting the leaked Google API key remediation

### Notes

- **ARCHITECTURE UPDATED**: Node.js backend + React frontend (hybrid approach) now uses Supadata API
- Backend handles transcript fetching via Supadata API (replaced youtube-transcript package)
- Frontend connects to backend API for transcript processing (no changes to frontend code)
- Gemini API integration ready but needs testing
- The `/exports/` directory should be git-ignored as it contains generated content
- **BENEFIT**: More reliable transcript fetching with better error handling and language support

## Bug Backlog

- [x] Empty transcript/summary files can be saved — guard against empty payloads on client/server (see `tasks/issues/empty-file-saves.md`)

## Tasks

- [x] 1.0 Project Setup and Configuration
  - [x] 1.1 Initialize Vite + React + TypeScript project
  - [x] 1.2 **COMPLETED**: Install core dependencies: `@google/generative-ai react-markdown express cors dotenv` (replaced youtube-transcript with Supadata API)
  - [x] 1.3 **COMPLETED**: Create `.env` file with `VITE_GEMINI_API_KEY` and `SUPADATA_API_KEY` (both keys configured)
  - [x] 1.4 Update `.gitignore` to exclude `.env` and `exports/`

- [x] 2.0 Core API Integration (YouTube + Gemini) 
  - [x] 2.1 Implement YouTube URL parsing in `src/utils.ts` with regex to extract video ID
  - [x] 2.2 **COMPLETED**: Create Node.js backend (`server.js`) for transcript fetching via Supadata API with dotenv
  - [x] 2.3 Load prompt template from `/prompts/youtube-transcripts.md` (embedded in code)
  - [x] 2.4 Implement Gemini API client and summary generation function
  - [x] 2.5 **COMPLETED**: Frontend calls backend API that uses Supadata API (working end-to-end)
  - [x] 2.6 Add transcript saving with localStorage + download functionality
  - [x] 2.7 **COMPLETED**: Create test interface in App.tsx for API validation (tested with Rick Roll video)

- [x] 3.0 React UI Components **PARTIALLY COMPLETE**
  - [x] 3.1 Create test UI in `src/App.tsx` with input field, button, and output area
  - [x] 3.2 Implement React state for: URL input, loading state, transcript output, errors
  - [x] 3.3 Add "Test Transcript Fetch" button that calls backend API
  - [x] 3.4 Display transcript preview with download functionality
  - [ ] 3.5 **TODO**: Replace test UI with production summarizer UI
  - [ ] 3.6 **TODO**: Integrate `react-markdown` for summary display
  - [ ] 3.7 **TODO**: Add full summarization workflow (transcript → AI → markdown)

- [x] 4.0 File System Integration **PARTIALLY COMPLETE**
  - [x] 4.1 Implement transcript download using blob URLs with `{videoId}-transcript.txt` format
  - [x] 4.2 Add localStorage persistence for transcripts
  - [ ] 4.3 **TODO**: Add summary file download as `{videoId}.md`
  - [ ] 4.4 **TODO**: Implement full summarization → file save workflow

- [x] 5.0 **RESOLVED**: Supadata API Integration & Frontend Access
  - [x] 5.1 Backend server working (port 3001) with Supadata API
  - [x] 5.2 Vite build process working
  - [x] 5.3 **FIXED**: Added dotenv package for environment variable loading
  - [x] 5.4 **COMPLETED**: Frontend accessible and working (localhost:5173)
  - [x] 5.5 **COMPLETED**: Full transcript fetching workflow tested and working

## 🎯 **NEXT STEPS - Phase 2: Complete Summarization Workflow**

- [x] 6.0 **COMPLETED**: Complete AI Summarization Integration
  - [x] 6.1 **COMPLETED**: Refactor prompt loading to read from `prompts/Youtube transcripts.md` file dynamically
  - [x] 6.2 **COMPLETED**: Fix transcript file saving to `exports/transcripts/` folder with proper file structure
  - [x] 6.3 **COMPLETED**: Create backend endpoints to read saved transcript files from disk
  - [x] 6.4 **COMPLETED**: Implement summarization workflow from saved transcript.txt files
  - [x] 6.5 **COMPLETED**: Add "Summarize" button to UI that calls `generateSummaryFromFile()`
  - [x] 6.6 **COMPLETED**: Display AI-generated summary with proper formatting and download
  - [x] 6.7 **COMPLETED**: Add comprehensive error handling for all API failures
  - [x] 6.8 **COMPLETED**: Test full workflow: URL → Transcript → Save to File → Read from File → AI Summary → Display

- [x] 6.9 **COMPLETED**: Server-Side Summary File Management
  - [x] 6.9.1 **COMPLETED**: Add `/api/save-summary` endpoint to save summaries to `exports/summaries/{videoId}-summary-{timestamp}.md`
  - [x] 6.9.2 **COMPLETED**: Modify summarization workflow to automatically save summaries server-side
  - [x] 6.9.3 **COMPLETED**: Add `/api/summaries` endpoint to list all saved summary files
  - [x] 6.9.4 **COMPLETED**: Add `/api/summary-file/{videoId}` endpoint to read specific saved summaries
  - [x] 6.9.5 **COMPLETED**: Update frontend to call server-side summary saving and added "Saved Summaries" UI section

- [x] 7.0 **COMPLETED**: Production UI Components - Complete Modern UI Overhaul
  - [x] 7.1 **COMPLETED**: Replaced test interface with sophisticated production UI based on modern dark theme design
  - [x] 7.2 **COMPLETED**: Added professional progress indicators with 4-stage workflow (Metadata • Transcript • AI Processing • Save)
  - [x] 7.3 **COMPLETED**: Implement summary download as `.md` files (browser-based with proper filename)
  - [x] 7.4 **COMPLETED**: Added history drawer with real saved summaries integration (clickable history items)
  - [x] 7.5 **COMPLETED**: Added comprehensive error messaging with retry functionality and user feedback
  - [x] 7.6 **COMPLETED**: Integrated Lucide React icons for professional visual design
  - [x] 7.7 **COMPLETED**: Auto-paste detection for YouTube URLs with instant processing
  - [x] 7.8 **COMPLETED**: Progressive enhancement UI (different experience for new vs returning users)
  - [x] 7.9 **COMPLETED**: Smooth animations with custom keyframes (fadeIn, pulse effects, transitions)

- [ ] 8.0 **ENHANCEMENT**: Polish & Optimization
  - [ ] 8.4 **TODO**: Optimize UI/UX with better styling and responsive design
  - [ ] 8.5 **TODO**: Add batch processing for multiple videos

## 📋 **DETAILED IMPLEMENTATION PLANS**

### **6.1 - Dynamic Prompt Loading Plan**
**Current Issue**: Prompt template is hardcoded in `src/api.ts` as a string constant
**Solution**: 
1. **Backend Approach**: Add endpoint `GET /api/prompt` that reads `prompts/Youtube transcripts.md`
2. **Frontend Update**: Modify `generateSummary()` to fetch prompt from backend before calling Gemini
3. **Benefits**: Prompt updates don't require code changes, easier prompt iteration

**Implementation Steps**:
- Add `fs.readFileSync()` in server.js to read prompt file
- Create new API endpoint that serves prompt content
- Update frontend to fetch prompt dynamically
- Add error handling for missing/corrupted prompt files

### **6.2 - File System Transcript Saving Plan**  
**Current Issue**: `saveTranscript()` only downloads files to user's Downloads and saves to localStorage
**Solution**: 
1. **Backend File Writing**: Add `POST /api/save-transcript` endpoint that writes to `exports/transcripts/`
2. **Frontend Update**: Modify `saveTranscript()` to call backend for file persistence
3. **File Structure**: `exports/transcripts/{videoId}-transcript-{timestamp}.txt`

**Implementation Steps**:
- Add file writing capabilities to server.js using `fs.writeFileSync()`
- Ensure `exports/transcripts/` directory exists (create if needed)
- Update frontend API call to save transcripts server-side
- Maintain current localStorage functionality for offline access

### **6.3-6.4 - Transcript-to-Summary Workflow Plan**
**Goal**: Process saved transcript files to generate summaries
**Architecture**:
1. **List Endpoint**: `GET /api/transcripts` - returns available transcript files
2. **Read Endpoint**: `GET /api/transcript/{videoId}` - reads specific transcript file
3. **Summarize Endpoint**: `POST /api/summarize/{videoId}` - processes file through Gemini API
4. **Save Summary**: Saves result to `exports/summaries/{videoId}-summary-{timestamp}.md`

**Implementation Steps**:
- Add file system reading capabilities to server.js
- Create transcript file listing and reading endpoints
- Modify summarization flow to work with file-based transcripts
- Add summary file saving with proper markdown formatting

### **6.9 - Server-Side Summary File Management Plan**
**Current Issue**: Summaries only download to user's browser, not saved to server file system
**Solution**: 
1. **Backend Endpoints**: Add summary file management similar to transcript handling
2. **Auto-Save**: When summary is generated, automatically save to `exports/summaries/{videoId}-summary-{timestamp}.md`
3. **Summary History**: List and retrieve saved summaries like transcripts

**Implementation Steps**:
- Add `fs.writeFileSync()` for summary files in server.js
- Create `/api/save-summary` endpoint that writes markdown files
- Add `/api/summaries` to list all saved summary files  
- Add `/api/summary-file/{videoId}` to read specific summaries
- Update frontend `generateSummaryFromFile()` to call server-side saving
- Add "Saved Summaries" UI section similar to "Saved Transcripts"

**File Structure**:
```
exports/
  transcripts/
    {videoId}-transcript-{timestamp}.txt
  summaries/
    {videoId}-summary-{timestamp}.md
```

### **Frontend Integration Plan**
**Current UI Workflow**:
1. **URL Input** → Fetch Transcript → Save to `exports/transcripts/`
2. **File List UI** → Display saved transcripts with metadata
3. **Summarize Button** → Process selected transcript → Generate AI summary
4. **Summary Display** → Show formatted markdown with browser download

**Current UI Workflow** (6.9 Completed):
1. **URL Input** → Fetch Transcript → Auto-save to `exports/transcripts/`
2. **Dual File Lists** → "Saved Transcripts" + "Saved Summaries" sections with metadata
3. **Summarize Buttons** → Auto-generate + auto-save to `exports/summaries/{videoId}-summary-{timestamp}.md`
4. **Summary Management** → View saved summaries, download as .md files, regenerate from transcripts
5. **Real-time Updates** → File lists refresh automatically after operations

- [x] 9.0 **COMPLETED**: Video Title Integration & Test Support (Phase 1)
  - [x] 9.1 **COMPLETED**: YouTube oEmbed API integration for video metadata (FREE - no API key required)
    - [x] 9.1.1 Added YouTube oEmbed API endpoint `/api/video-metadata/:videoId` in server.js
    - [x] 9.1.2 No API key needed - uses YouTube's free oEmbed service
    - [x] 9.1.3 Created `fetchVideoMetadata(videoId)` function in api.ts with full TypeScript typing
    - [x] 9.1.4 Comprehensive error handling for rate limits, missing videos, and network issues
  - [x] 9.2 **COMPLETED**: Title-based file naming system implemented
    - [x] 9.2.1 Created `sanitizeTitle(title)` function in utils.ts (removes invalid filesystem chars, limits length)
    - [x] 9.2.2 Implemented `generateTranscriptFilename(title, timestamp)` function in utils.ts
    - [x] 9.2.3 Implemented `generateSummaryFilename(title, timestamp)` function in utils.ts
    - [x] 9.2.4 Both functions ensure consistent naming with matching base names (verified by tests)
  - [x] 9.3 **COMPLETED**: Updated all save functions to use video titles
    - [x] 9.3.1 Updated `saveTranscript()` to accept optional title parameter and fetch metadata
    - [x] 9.3.2 Updated `saveSummaryToServer()` to use title from metadata
    - [x] 9.3.3 Added graceful fallback to videoId if title extraction fails
    - [x] 9.3.4 Updated backend endpoints (`/api/save-transcript`, `/api/save-summary`) for title-based filenames
  - [x] 9.4 **COMPLETED**: All tests now pass
    - [x] 9.4.1 Fixed first test to properly validate video ID extraction
    - [x] 9.4.2 Implemented and exported `generateTranscriptFilename()` from utils.ts
    - [x] 9.4.3 Implemented and exported `generateSummaryFilename()` from utils.ts
    - [x] 9.4.4 Both functions return matching base names (test validation: ✅ 2/2 tests passing)
  - [x] 9.5 **COMPLETED**: UI enhancements for video metadata display
    - [x] 9.5.1 Added video metadata state management in App.tsx
    - [x] 9.5.2 Created video information display with title, author, and thumbnail
    - [x] 9.5.3 Integrated metadata fetching into main workflow (URL → metadata → transcript → summary)
    - [x] 9.5.4 Graceful UI fallback when metadata unavailable

## 🎯 **PHASE 1 RESULTS (COMPLETED 07/23/25)**
- **File Naming Transformation**: 
  - **Before**: `dQw4w9WgXcQ-transcript-2025-07-22T01-51-19.txt`
  - **After**: `Rick Astley - Never Gonna Give You Up-transcript-2025-07-22T01-51-19.txt`
- **Zero Cost Solution**: Uses YouTube's free oEmbed API (no API key required)
- **Production Verified**: Server logs confirm title-based naming working in live environment
- **Test Coverage**: All tests passing (2/2) with proper filename generation validation

## 🚀 **CURRENT STATUS: 98% Complete - Production Ready!**
- ✅ **Infrastructure**: Complete (Vite + React + Node.js + APIs)
- ✅ **Transcript Fetching**: Complete (Supadata API integration working)
- ✅ **AI Summarization**: Complete (file-based workflow with dynamic prompts)  
- ✅ **File Management**: Complete (file system persistence for transcripts AND summaries)
- ✅ **Summary File Management**: Complete (server-side saving, listing, reading, and UI management)
- ✅ **Video Title Integration**: Complete (YouTube oEmbed API integration with title-based file naming)
- ✅ **Production UI**: Complete (sophisticated dark theme UI with animations, progress indicators, history drawer, auto-paste, error handling)

## 🆕 **PHASE 3: Tactiq-Inspired UI Overhaul**

- [ ] 10.0 Discovery & Experience Brief
  - [ ] 10.1 Capture detailed requirements from the Tactiq landing page (layout, copy hierarchy, gradients, typography, interaction states)
  - [ ] 10.2 Inventory the current WatchLater screens and flows to preserve existing functionality while redesigning the shell
  

- [ ] 11.0 Visual System & Design Tokens
  - [ ] 11.1 Establish global style primitives (fonts, shadows, radii, spacing) that mirror the Tactiq aesthetic via CSS variables or Tailwind config. Also reference the ios 26 aesthetic as the primary.
  - [ ] 11.2 Implement background gradient system (dark plum base + radial highlights) and reusable containers for consistent padding
  - [ ] 11.3 Define gradient text and button treatments (primary CTA, secondary ghost) with hover/focus states

- [x] 12.0 Landing Experience Rebuild *(implemented in src/App.tsx & src/App.css)*
  - [x] 12.1 Reconstruct hero layout with centered headline/subheadline copy and gradient-highlighted keywords
  - [x] 12.2 Replace URL input + CTA with pill-shaped field and gradient-stroked button that mirrors Tactiq’s form styling
  - [x] 12.3 Add supporting microcopy ("Instantly, without uploading video files", trust badges) and restructure spacing for mobile-first responsiveness
  - [x] 12.4 Create responsive layout rules (sm/md/lg breakpoints) to maintain alignment and vertical rhythm on all screen sizes

- [x] 13.0 Application Surface Harmonization *(implemented in src/App.tsx & src/App.css)*
  - [x] 13.1 Update transcript/summary modules to use new card glassmorphism styling and typography scale
  - [x] 13.2 Redesign status indicators (progress, success, error) with neon accents and subtle motion consistent with Tactiq
  - [x] 13.3 Refresh history drawer/list interactions using new button styles, icons, and transition timing
  - [x] 13.4 Audit modals, alerts, and notifications for parity; retire legacy CSS classes that conflict with the new system

- [ ] 14.0 QA & Launch Readiness
  - [x] 14.3 Update documentation/screenshots (README, marketing assets) to reflect the new experience *(README.md, README.md, docs/assets/)*
  - [ ] 14.4 Remove unused assets/styles and log post-launch polish follow-ups in tasks backlog

## 🆕 Feature: PDF Download for Summaries

- [ ] 15.0 Backend PDF Export Pipeline
  - [ ] 15.1 Install and configure `puppeteer` (with Chromium download strategy) and `markdown-it`; update `package.json` scripts if needed.
  - [ ] 15.2 Build a reusable markdown-to-HTML helper in `server/markdown-to-html.js` that mirrors client styling (headings, lists, code blocks).
  - [ ] 15.3 Implement `server/pdf-renderer.js` that accepts HTML, applies print stylesheet, and streams `page.pdf()` output via Puppeteer.
  - [ ] 15.4 Add `GET /api/summary/:videoId/pdf` route to `server.js` that resolves the latest summary file, invokes the renderer, and sets `Content-Type: application/pdf`.
  - [ ] 15.5 Harden error handling for missing summaries, Puppeteer launch failures, and concurrent exports; log durations for observability.

- [ ] 16.0 Client UX Integration
  - [ ] 16.1 Add "Download PDF" buttons adjacent to existing markdown download controls in saved summaries list/detail views.
  - [ ] 16.2 Wire the new UI to the backend via `window.open` or fetch+blob to trigger downloads with sanitized filenames.
  - [ ] 16.3 Provide loading/errostate feedback so users know when the PDF export succeeded or failed without blocking markdown downloads.

- [ ] 17.0 Verification & Testing
  - [ ] 17.1 Unit test markdown-to-HTML conversion to ensure parity with client rendering (headings, lists, links, code, blockquotes).
  - [ ] 17.2 Add integration test (`tests/pdf-route.test.ts`) to confirm PDF responses include correct headers, non-zero byte payloads, and 404 behavior.
  - [ ] 17.3 Run manual QA covering long summaries, summaries with images/data URIs, and simultaneous export requests; capture findings in QA notes.

- [ ] 18.0 Documentation & Ops
  - [ ] 18.1 Update `README.md` and `docs/prd-youtube-summarizer.md` to describe the PDF download capability and prerequisites.
  - [ ] 18.2 Add operational guidance (Chromium caching, Puppeteer sandbox flags, environment variables) to `ARCHITECTURE.md` or a new `docs/pdf-export.md`.
  - [ ] 18.3 Document logging/monitoring expectations for PDF generation failures to inform alerting and support triage.

## 🔐 Secret Remediation (Google API Key Exposure)

- [ ] 19.0 Rotate & Contain
  - [ ] 19.1 Revoke the compromised Google API key in Google Cloud Console and generate a fresh credential.
  - [ ] 19.2 Validate the new key via manual smoke test (local summary generation) and confirm logging captures the new key usage only through env variables.
  - [ ] 19.3 Purge the exposed key from git history (e.g., `git filter-repo` or GitHub Secret Scanning mitigation) and force-push/remedy forks per security policy.

- [ ] 20.0 Secure Storage & Deployment
  - [ ] 20.1 Ensure `.env` and deployment secrets files remain git-ignored; double-check build artifacts for embedded keys.
  - [ ] 20.2 Update deployment configuration (Render, Vercel, Docker, etc.) to use the rotated key via environment secrets manager.
  - [ ] 20.3 Add runtime guardrails that throw if the Google API key is missing or hard-coded (server + client).

- [ ] 21.0 Detection & Automation
  - [ ] 21.1 Add CI secret scanning (e.g., `gitleaks` GitHub Action) gating pull requests.
  - [ ] 21.2 Configure Git hooks or lint rules (`lefthook`, `pre-commit`) to scan staged changes for high-entropy strings before commits.
  - [ ] 21.3 Document and enable GitHub Secret Scanning alerts for private forks or downstream repos, if available.

- [ ] 22.0 Documentation & Onboarding
  - [ ] 22.1 Update `ARCHITECTURE.md` or `SECURITY.md` with the new secret management workflow and rotation playbook.
  - [ ] 22.2 Add onboarding checklist steps for developers covering `.env` setup, secret rotation cadence, and scanning tools.
  - [ ] 22.3 Communicate remediation steps to the team (Slack/email) and track acknowledgement for compliance.
