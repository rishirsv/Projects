# PRD — One-Click YouTube URL Summarizer (WatchLater v0)

## 1. Overview
Build a local-only React app that lets a single user (Rishi) paste a YouTube URL and receive a structured AI-generated summary of the video. The app fetches the transcript (if available), summarizes using Gemini, displays the result in markdown, and saves the summary as a local markdown file. This is the foundation for future playlist and automation features.

## 2. Goals
- Paste a YouTube URL and get a readable summary within 10 seconds.
- Automatically save the summary to a local markdown file named after the video ID.
- Use as few dependencies and UI components as possible to keep setup fast and minimal.

## 3. User Stories
| ID   | As a…      | I want to…                                   | So that…                            |
|------|------------|----------------------------------------------|-------------------------------------|
| US-1 | solo user  | paste a YouTube link and click "Summarize"   | I get the main takeaways instantly. |
| US-2 | solo user  | have the summary saved locally as markdown   | I can grep, sync, or version it.    |
| US-3 | solo user  | get error feedback if transcript fails       | I understand why it didn't work.    |

## 4. Functional Requirements
1. Accept standard YouTube URL input.
2. Extract video ID from URL.
3. Attempt to fetch transcript using `youtube-transcript`.
4. If transcript fails, use Gemini's built-in video URL ingestion.
5. Inject transcript into summary prompt template (stored in `/prompts/youtube-transcripts.md`).
6. Send to Gemini 2.5 Flash API using `google-genai` client and `.env.local` key.
7. Display the output using `react-markdown`.
8. Save a `.md` file with the same content to `/summaries/{videoId}.md`.
9. Show loader and error state during processing.

## 5. Non-Goals
- No authentication, no database, no UI library (tailwind optional).
- No playlist handling.
- No multi-user features.
- No deployment — this is a local tool.

## 6. Design
- One-page app with minimal layout: input, button, output.
- Default Vite CSS or minimal Tailwind if needed.
- App lives in `src/components/App.tsx`.

## 7. Technical Notes
- Node ≥ 18 required.
- Uses Vite + React + TypeScript.
- Must be runnable from `npm run dev` without additional setup.
- Summary file is saved using Node's `fs` module in development (or alternate in-browser storage fallback TBD).

## 8. Success Metrics
| Metric                         | Target      |
|--------------------------------|-------------|
| Summary response time          | ≤ 10 seconds|
| Save file success rate         | 100%        |
| Error message shown if failed  | Yes         |

## 9. Open Questions
1. Add optional front-matter (title, date, url) to summary markdown?
2. Use video title in filename instead of videoId?
3. What format should error logging follow (console, file, toast)?
