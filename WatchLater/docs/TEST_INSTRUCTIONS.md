# Local Test Instructions (Transcript + Summary)

## Setup
1) Create `.env` (see `.env.example` for the full set):
```
VITE_GEMINI_API_KEY=...
VITE_MODEL_OPTIONS=gemini-2.5-flash|Gemini 2.5 Flash,openrouter/openai/gpt-4o-mini|GPT-4o Mini (OpenRouter),openrouter/x-ai/grok-4-fast:free|Grok 4 Fast (OpenRouter)
VITE_MODEL_DEFAULT=openrouter/openai/gpt-4o-mini

SUPADATA_API_KEY=...
OPENROUTER_API_KEY=...
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
- Toggle the **Model** selector to Grok 4 Fast and regenerate; confirm file metadata records the chosen model.

## Error cases
- Invalid URL or malformed IDs → user-facing error
- Video without transcript (Supadata returns 404/empty)
- Supadata 401 (bad key)
- Gemini quota/rate limit (client shows error)
- OpenRouter quota/401 (server returns actionable message)

## Notes
- Keys are local only. Do not deploy with `VITE_GEMINI_API_KEY` exposed.
- Use DevTools Network tab to inspect `/api/*` calls; server logs show file writes.
