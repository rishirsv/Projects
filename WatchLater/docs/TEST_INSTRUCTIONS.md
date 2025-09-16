# YouTube Summarizer — Test Instructions

## Setup
1. Create `.env` with both keys:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   SUPADATA_API_KEY=your_supadata_api_key
   ```

2. Start both servers (backend + frontend):
   ```bash
   ./start.sh
   # or: npm run start
   ```

3. Verify backend health:
   ```bash
   curl http://localhost:3001/health
   ```

4. Open the app: http://localhost:5173

## Testing the Full Flow

### Good Test URLs (likely to have transcripts):
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Roll - classic test video)
- https://youtu.be/dQw4w9WgXcQ (Short URL format)
- https://www.youtube.com/watch?v=9bZkp7q19f0 (PSY - Gangnam Style)

### What to test:
1. **URL Parsing**: Paste different YouTube URL formats; app auto-detects and starts
2. **Metadata Stage**: Title and channel info fetched via oEmbed
3. **Transcript Stage**: Server fetches transcript via Supadata and saves to disk
4. **AI Stage**: Gemini generates markdown using prompt from `/prompts/Youtube transcripts.md`
5. **Save Stage**: Summary auto-saves to disk; history updates
6. **History**: Open a saved summary from the right panel

### Expected Results:
- Valid URLs extract video IDs correctly
- Metadata displays or gracefully falls back
- Transcript saved to: `exports/transcripts/{videoId}__{sanitizedTitle}-transcript-{timestamp}.txt`
- Summary saved to: `exports/summaries/{videoId}__{sanitizedTitle}-summary-{timestamp}.md`
- History panel lists saved summaries with timestamps and size
- Console logs show stage progress

### Error Cases to Test:
- Invalid YouTube URLs
- Videos without available transcripts
- Network connectivity issues (backend down)
- Supadata 401/429
- Malformed URLs

## Backend Endpoints (for debugging)
- GET `/health` — server status
- POST `/api/transcript` — fetch transcript `{ videoId }`
- GET `/api/video-metadata/:videoId` — oEmbed metadata
- GET `/api/prompt` — prompt template content
- POST `/api/save-transcript` — write transcript to `exports/transcripts`
- POST `/api/save-summary` — write summary to `exports/summaries`
- GET `/api/summaries` — list saved summaries
- GET `/api/summary-file/:videoId` — read latest summary for a video

## Files on Disk
All generated files live under `exports/` at the repo root. You can open the folder to verify filenames, sizes, and timestamps.
