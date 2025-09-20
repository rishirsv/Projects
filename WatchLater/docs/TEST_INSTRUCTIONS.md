# Local Test Instructions (Transcript + Summary)

## Setup
1) Create `.env`:
```
VITE_GEMINI_API_KEY=...
SUPADATA_API_KEY=...
```

2) Install and run:
```bash
npm ci
npm run server   # port 3001
npm run dev      # port 5173
```

3) Open http://localhost:5173

## Happy path
- Paste a YouTube URL → click **Summarize**.
- Watch stages progress (Fetch transcript → Save transcript → Generate summary → Save summary).
- Confirm files written:
  - `exports/transcripts/<videoId>__<sanitizedTitle>-transcript-<timestamp>.txt`
  - `exports/summaries/<videoId>__<sanitizedTitle>-summary-<timestamp>.md`

## Error cases
- Invalid URL or malformed IDs → user-facing error
- Video without transcript (Supadata returns 404/empty)
- Supadata 401 (bad key)
- Gemini quota/rate limit (client shows error)

## Notes
- Keys are local only. Do not deploy with `VITE_GEMINI_API_KEY` exposed.
- Use DevTools Network tab to inspect `/api/*` calls; server logs show file writes.
