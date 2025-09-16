# PRD — YouTube Watch-Later Summarizer (Hybrid Client–Server MVP)

## 1. Overview
Build a fast local-first app that converts YouTube URLs into structured markdown summaries. The app uses a hybrid architecture: a lightweight Express backend fetches transcripts via Supadata, serves prompt templates, and writes files to `exports/`, while the React frontend orchestrates UI and calls Gemini 2.5 Flash directly in the browser.

## 2. Goals
- Paste a YouTube URL and get a readable summary within ~10 seconds.
- Use a local backend to reliably fetch transcripts (Supadata) and manage files.
- Save transcripts and summaries with title-aware filenames for easy recall.
- Keep AI key in the browser; keep transcript fetching and file I/O on the server for privacy and reliability.

## 3. User Stories
| ID   | As a…      | I want to…                                   | So that…                            |
|------|------------|----------------------------------------------|-------------------------------------|
| US-1 | solo user  | paste a YouTube link and click "Summarize"   | I get the main takeaways instantly. |
| US-2 | solo user  | have the summary saved locally as markdown   | I can grep, sync, or version it.    |
| US-3 | solo user  | get error feedback if transcript fails       | I understand why it didn't work.    |
| US-4 | solo user  | see proper titles in filenames               | I can find files quickly by name.   |

## 4. Architecture Components

### Frontend (React App)
- **Input**: URL field with paste-detect, CTA
- **Client Bridge**: `src/api.ts` calls local server for transcripts, files, and prompt; calls Gemini in-browser
- **Display**: `react-markdown` for summaries; history panel lists saved files

### Backend (Express Server)
- **Transcript Source**: Supadata API via server proxy (`/api/transcript`)
- **Video Metadata**: YouTube oEmbed (`/api/video-metadata/:videoId`) for title/author/thumb
- **File I/O**: Save/read transcripts and summaries in `exports/`
- **Prompt Template**: Serve `prompts/Youtube transcripts.md`

### Processing Pipeline
- **URL Parsing**: Extract video ID
- **Metadata Fetch**: Get title via oEmbed; sanitize for filenames
- **Transcript Fetch**: Server calls Supadata; save to `exports/transcripts/`
- **AI Processing**: Frontend loads prompt from server and uses Gemini 2.5 Flash
- **Summary Save**: Server writes to `exports/summaries/`

## 5. Functional Requirements

### Core Features
1. Accept standard YouTube URL input
2. Extract video ID from URL patterns
3. Fetch video metadata (title) using oEmbed via server
4. Fetch transcript using Supadata via server
5. Display progress/loading states for each stage
6. Load prompt template from server and send to Gemini 2.5 Flash
7. Render returned markdown summary
8. Save transcript and summary to `exports/` with title-aware filenames (`{videoId}__{sanitizedTitle}-…`)
9. Handle errors (invalid URL, missing transcript, API failures, rate limits)

### Error Handling
- Show user-friendly messages for common failures
- Fallback behavior when transcript unavailable
- Network error recovery
- Invalid URL detection

## 6. Technical Implementation

### Frontend Stack
- **Framework**: Vite + React + TypeScript
- **Dependencies**:
  - `@google/generative-ai` for Gemini API (browser)
  - `react-markdown` for rendering
- **Files**: `src/App.tsx` (UI), `src/api.ts` (client bridge), `src/utils.ts` (URL/title helpers)
- **Environment**: `.env` with `VITE_GEMINI_API_KEY`

### Backend Stack
- **Framework**: Express 5 + Node
- **Responsibilities**: Transcript proxy (Supadata), file I/O, prompt serving, metadata lookup (oEmbed)
- **Environment**: `.env` with `SUPADATA_API_KEY`

### API Integration
- **Supadata**: Server-side transcript fetching (CORS-safe and reliable)
- **oEmbed**: Server-side video metadata (no API key)
- **Gemini**: Browser calls using `@google/generative-ai`
- **File System**: Server writes to `exports/` (transcripts and summaries)

## 7. File Structure
```
repo-root/
├── docs/
│   └── prd-youtube-summarizer.md
├── prompts/
│   └── Youtube transcripts.md     # AI prompt template
├── exports/
│   ├── summaries/                 # Generated summaries (git-ignored)
│   └── transcripts/               # Generated transcripts (git-ignored)
├── src/
│   ├── App.tsx                    # Main React component
│   ├── api.ts                     # Client ↔ server + Gemini
│   └── utils.ts                   # URL parsing, filename helpers
├── server.js                       # Express API (Supadata, oEmbed, files)
├── .env                            # VITE_GEMINI_API_KEY, SUPADATA_API_KEY
└── package.json
```

## 8. Success Metrics
| Metric                         | Target      |
|--------------------------------|-------------|
| Summary response time          | ≤ 10 seconds|
| Frontend bundle size           | ≤ 200kb     |
| Setup time (clone to running)  | ≤ 3 minutes |
| Transcript fetch success rate  | ≥ 85%       |
| Save + history refresh         | ≤ 2 seconds |

## 9. Implementation Steps
1. **Project Setup**: Initialize Vite + React + TypeScript
2. **Dependencies**: Install youtube-transcript, @google/generative-ai, react-markdown
3. **Core Logic**: Build transcript fetching and Gemini integration in api.ts
4. **UI Components**: Create minimal input/output interface in App.tsx
5. **File Handling**: Implement local markdown file saving
6. **Error Handling**: Add comprehensive error states and user feedback
7. **Testing**: Verify with various YouTube URLs and edge cases

## 10. Video Title Integration & File Naming ✅ **COMPLETED**

### 10.1 YouTube oEmbed API Integration for Video Metadata ✅ **IMPLEMENTED**
- **Goal**: Extract video titles to improve file naming convention ✅ **ACHIEVED**
- **Previous**: Files named with video IDs (`dQw4w9WgXcQ-transcript.txt`)
- **Current**: Files named with video titles (`Rick Astley - Never Gonna Give You Up-transcript.txt`)
- **Solution**: YouTube oEmbed API (FREE - no API key required)

### 10.2 Requirements ✅ **ALL COMPLETED**
- ✅ Fetch video metadata (title, author, thumbnail) from YouTube oEmbed API
- ✅ Sanitize video titles for filesystem compatibility (`sanitizeTitle()` function)
- ✅ Update file naming conventions for both transcripts and summaries
- ✅ Ensure consistent naming between transcript and summary files (verified by tests)
- ✅ Add fallback to video ID if title extraction fails (graceful degradation)

### 10.3 Implementation Results ✅ **ALL TASKS COMPLETE**
- ✅ **T-10.1**: YouTube oEmbed API integration (server.js endpoint `/api/video-metadata/:videoId`)
- ✅ **T-10.2**: `fetchVideoMetadata()` function created in api.ts with full TypeScript typing
- ✅ **T-10.3**: `sanitizeTitle()` function implemented (removes invalid chars, limits length)
- ✅ **T-10.4**: `generateTranscriptFilename()` and `generateSummaryFilename()` functions in utils.ts
- ✅ **T-10.5**: Updated `saveTranscript()` and `saveSummaryToServer()` to use titles
- ✅ **T-10.6**: Tests implemented and passing (2/2 tests ✅)
- ✅ **T-10.7**: Comprehensive error handling for private videos, unavailable titles, network failures

### 10.4 Production Verification ✅ **CONFIRMED WORKING**
- **Live Environment**: Server logs confirm title-based naming active
- **Example Output**: `What 10 Years of Running A Business Taught Me - Hard Truth-transcript-2025-07-23T03-51-41.txt`
- **UI Integration**: Video metadata display with title, author, and thumbnail
- **Zero Downtime**: Backward compatible with existing videoId-based files
- **Zero Cost**: No API keys required, uses YouTube's free oEmbed service
