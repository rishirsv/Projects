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
- **AI Processing**: Google Gemini 2.5 Flash API for summarization
- **Transcript Source**: Supadata API (via backend proxy)
- **File Storage**: Local filesystem in `/exports/` directory

### Key Data Flow
1. **URL Input** → Extract video ID → Backend transcript fetch (Supadata API)
2. **Transcript Storage** → Save to `exports/transcripts/{videoId}__{sanitizedTitle}-transcript-{timestamp}.txt`
3. **AI Processing** → Load prompt from `prompts/Youtube transcripts.md` → Gemini API
4. **Summary Storage** → Save to `exports/summaries/{videoId}__{sanitizedTitle}-summary-{timestamp}.md`

### Critical Components

#### Frontend (`src/`)
- **App.tsx**: Main React component with full UI workflow (transcript fetching, summarization, file management)
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
- **File System**: Auto-creates `exports/transcripts/` and `exports/summaries/` directories

## Environment Configuration

### Required Environment Variables
Create `.env` file with:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
SUPADATA_API_KEY=your_supadata_api_key
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
2. **UI Changes**: Modify `src/App.tsx` (single-component architecture)
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
- **Transcripts**: `{videoId}__{sanitizedTitle}-transcript-{timestamp}.txt`
- **Summaries**: `{videoId}__{sanitizedTitle}-summary-{timestamp}.md`
- **Timestamps**: ISO format with colons/periods replaced by hyphens
- **Sanitization**: Remove invalid filesystem chars; trim and limit length

### API Architecture
- **Frontend → Backend**: All transcript fetching goes through backend proxy
- **Frontend → Gemini**: Direct API calls for AI processing (API key in frontend env)
- **File Operations**: Backend handles all file I/O operations

### Error Handling
- **Network Issues**: Comprehensive error messages for API failures
- **Missing Files**: Graceful fallbacks and user feedback
- **API Limits**: Rate limiting awareness (especially Supadata API)

### Current Development Status
- ✅ **Core Features**: Complete (transcript fetch + AI summary + file management)
- ✅ **Video Title Integration**: Complete (oEmbed-based titles + filename sanitization; tests passing)
- ✅ **Production UI**: Phase 3 interface shipped (progress, history, glass cards)

### Known Technical Debt
- Single-component architecture in `App.tsx` (could be split)
- YouTube Data API v3 integration needed for video title-based file naming
- Test interface mixed with production UI (needs separation)
