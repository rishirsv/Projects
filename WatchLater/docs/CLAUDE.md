# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
- `npm run dev` - Start Vite frontend development server (port 5173)
- `npm run server` - Start Express backend API server (port 3001)
- `npm start` - Start both frontend and backend concurrently

### Build & Quality
- `npm run build` - Build production React app (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint on codebase
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run Jest test suite
- Tests are located in `/tests/` directory with `.test.ts` extensions
- Test configuration in `jest.config.js`

## Architecture Overview

This is a **YouTube transcript summarizer** with a hybrid client-server architecture:

### Core Architecture
- **Frontend**: Vite + React + TypeScript (port 5173)
- **Backend**: Express.js server (port 3001) 
- **AI Processing**: Pluggable models (Gemini runs in-browser; OpenRouter routes through backend)
- **Transcript Source**: Supadata API (via backend proxy)
- **File Storage**: Local filesystem in `/exports/` directory

### Key Data Flow
1. **URL Input** → Extract video ID → Backend transcript fetch (Supadata API)
2. **Transcript Storage** → Save to `exports/transcripts/{videoId}-transcript-{timestamp}.txt`
3. **AI Processing** → Load prompt from `prompts/Youtube transcripts.md` → Active model (Gemini via client SDK, OpenRouter via backend proxy)
4. **Summary Storage** → Save to `exports/summaries/{videoId}-summary-{timestamp}.md`

### Critical Components

#### Frontend (`src/`)
- **App.tsx**: Orchestrator component handling state, async flows, and wiring extracted presentational components
- **components/**: Memoized presentational pieces (header, hero, pipeline, summary viewer, history panel, delete modal, toast)
- **api.ts**: All API integration (backend calls, Gemini AI, file operations)
- **utils.ts**: YouTube URL parsing and utility functions

#### Backend (`server.js`)
- **Express server** handling all file I/O and external API calls
- **Supadata API integration** for transcript fetching (replaces youtube-transcript package)
- **File management endpoints** for transcripts and summaries
- **Prompt template serving** from `/prompts/Youtube transcripts.md`

#### External Dependencies
- **Supadata API**: Requires `SUPADATA_API_KEY` environment variable
- **Google Gemini**: Requires `VITE_GEMINI_API_KEY` environment variable
- **OpenRouter** (optional for GPT/Grok models): Requires `OPENROUTER_API_KEY` and `VITE_MODEL_OPTIONS` entries prefixed with `openrouter/`
- **File System**: Auto-creates `exports/transcripts/` and `exports/summaries/` directories

## Environment Configuration

### Required Environment Variables
Create `.env` file with:
```
# Client-side (browser)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_MODEL_OPTIONS=gemini-2.5-flash|Gemini 2.5 Flash,openrouter/openai/gpt-4o-mini|GPT-4o Mini (OpenRouter)
VITE_MODEL_DEFAULT=openrouter/openai/gpt-4o-mini

# Server-side
SUPADATA_API_KEY=your_supadata_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_APP_URL=http://localhost:5173
OPENROUTER_APP_TITLE=WatchLater Summaries
```

### Directory Structure
```
exports/
  transcripts/     # Auto-generated transcript files (git-ignored)
  summaries/       # Auto-generated summary files (git-ignored)
prompts/
  Youtube transcripts.md    # AI prompt template (editable)
```

## Development Workflows

### Adding New Features
1. **API Changes**: Update both `src/api.ts` (frontend) and `server.js` (backend)
2. **UI Changes**: Update `src/App.tsx` orchestration and the relevant components under `src/components/`
3. **AI Prompts**: Edit `prompts/Youtube transcripts.md` (no code changes needed)

### Testing Video IDs
Common test URLs in codebase:
- `dQw4w9WgXcQ` (Rick Roll) - most reliable for testing
- `9bZkp7q19f0` (Gangnam Style)
- `kJQP7kiw5Fk` (Despacito)

### Debugging
- **Backend Health**: http://localhost:3001/health
- **CORS Issues**: Backend has CORS enabled for frontend
- **API Failures**: Check browser console + server logs
- **File Issues**: Verify `exports/` directory permissions

## Key Implementation Details

### File Naming Convention
- **Transcripts**: `{videoId}-transcript-{timestamp}.txt`
- **Summaries**: `{videoId}-summary-{timestamp}.md`
- **Timestamps**: ISO format with colons/periods replaced by hyphens

### Model Selection
- Model options are injected from `VITE_MODEL_OPTIONS` at runtime and cached on `window.__WATCH_LATER_IMPORT_META_ENV__`.
- Session storage key is namespaced to the current default model so changing `VITE_MODEL_DEFAULT` resets incompatible selections automatically.
- Gemini models call the Google Generative AI SDK directly from the browser; `openrouter/...` models are proxied through `/api/openrouter/generate`.

### API Architecture
- **Frontend → Backend**: All transcript fetching goes through backend proxy
- **Frontend → Gemini**: Direct API calls for AI processing (API key in frontend env)
- **Frontend → Backend → OpenRouter**: `/api/openrouter/generate` wraps any `openrouter/...` models with the requisite headers
- **File Operations**: Backend handles all file I/O operations

### Error Handling
- **Network Issues**: Comprehensive error messages for API failures
- **Missing Files**: Graceful fallbacks and user feedback
- **API Limits**: Rate limiting awareness (especially Supadata API)

### Current Development Status
- ✅ **Core Features**: Complete (transcript fetch + AI summary + file management)
- ⚠️ **Video Title Integration**: In progress (tests failing, needs YouTube Data API v3)
- 🔄 **UI Polish**: Functional but could use visual improvements

### Known Technical Debt
- App.tsx orchestrates logic while presentational components now live under `src/components/`
- YouTube Data API v3 integration needed for video title-based file naming
- Test interface mixed with production UI (needs separation)
