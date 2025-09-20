# Architecture

## Overview
WatchLater converts a YouTube URL into a saved Markdown summary. It runs locally with a small Express API and a React/Vite frontend.

```
Frontend (Vite/React/TS)
  └── calls Express API @ localhost:3001
        ├── GET /api/video-metadata/:videoId  (YouTube oEmbed → title/author/thumbnail)
        ├── POST /api/transcript               (Supadata → transcript text)
        ├── POST /api/save-transcript          (writes exports/transcripts/*.txt)
        ├── POST /api/summarize/:videoId       (prepares prompt + transcript)
        ├── POST /api/save-summary             (writes exports/summaries/*.md)
        ├── GET  /api/transcripts|summaries    (lists saved files)
        └── GET  /api/*-file/:videoId          (serves latest file by videoId)
```

## Data flow
1. User pastes URL → `extractVideoId()` finds the 11-char ID.
2. Client fetches `/api/video-metadata/:id` for title and thumbnail.
3. Client posts `/api/transcript` with `videoId`; server calls Supadata and returns plain text (plus minimal metadata).
4. Client saves transcript via `/api/save-transcript` (title-aware filename).
5. Client fetches prompt via `/api/prompt` and calls Gemini in-browser to generate Markdown.
6. Client saves summary via `/api/save-summary`.

## Storage
- `exports/transcripts/*.txt` – Transcript + a simple frontmatter header
- `exports/summaries/*.md` – Structured Markdown summary with the same `${videoId}__${sanitizedTitle}` base
- No database; the filesystem is the source of truth.

## Key design choices
- **Local-first**: everything runs locally. The Gemini key is used in the browser by design (do not deploy this pattern).
- **Title-aware filenames**: stable key is `videoId`; the title is sanitized and included for human readability.
- **Thin backend**: Express only proxies transcript fetch and handles file IO; summarization remains client-side.

## Known limitations
- CORS is wide open by default; restrict via `ALLOWED_ORIGINS` before sharing beyond localhost.
- No rate limiting/auth → not safe for public exposure.
- Filename sanitization is minimal and can produce mojibake for typographic quotes; see refactor plan.
