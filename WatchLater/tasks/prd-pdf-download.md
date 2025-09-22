# PRD — PDF Download for Saved Summaries

## 1. Introduction / Overview
Add a PDF export pathway for saved summaries so users can download polished, shareable documents that mirror the in-app markdown rendering. Generation must occur server-side without external services.

## 2. Goals
- Offer a "Download PDF" control alongside existing markdown exports.
- Produce PDFs that match in-app styling (headings, lists, code, callouts) including dark theme considerations.
- Keep the workflow fully local to protect transcript data and avoid new vendor costs.

## 3. User Stories
| ID    | As a…        | I want to…                                   | So that…                                      |
|-------|--------------|-----------------------------------------------|-----------------------------------------------|
| PDF-1 | researcher    | Download a PDF version of a saved summary     | I can archive or share summaries in a fixed format. |
| PDF-2 | repeat user   | Trigger PDF export without re-running AI      | I avoid extra Gemini spend and latency.       |
| PDF-3 | accessibility | Receive PDFs that preserve headings/links     | I can review offline or print them cleanly.   |

## 4. Functional Requirements
1. Add a backend route `GET /api/summary/:videoId/pdf` returning an `application/pdf` stream.
2. Locate the latest markdown summary for the requested video (respecting title-based filenames) and convert it to HTML using shared renderer logic.
3. Wrap HTML in a print-optimized template that inlines required CSS/assets and keeps parity with client styling.
4. Render PDFs with Puppeteer (`page.setContent`, `page.pdf({ format: 'A4', printBackground: true, margin: 20mm })`).
5. Set appropriate response headers (`Content-Type`, `Content-Disposition`) using sanitized filenames.
6. Handle errors (missing file, renderer failure, concurrent generation limits) with descriptive responses exposed to the UI.
7. Add a UI control next to existing downloads that initiates the PDF export and shows status feedback.

## 5. Non-Goals
- Persistent caching/storage of generated PDFs (on-demand only).
- PDF exports for transcripts or other asset types.
- Client-side printing or PDF generation.

## 6. Design Considerations
- Align button placement and iconography with markdown download action for discoverability.
- Ensure PDFs support both light and dark theme content readability.
- Keep UI responsive; consider grouping downloads if space constrained.

## 7. Technical Considerations
- Add `puppeteer` and `markdown-it` dependencies; document Chromium requirements for CI/deployment.
- Reuse/extend existing markdown rendering for consistency; share code between client and server when possible.
- Protect against path traversal; open files only within `exports/summaries`.
- Instrument logging for generation duration and failures.

## 8. Success Metrics
- ≥ 95% of PDF exports complete within 5 seconds for summaries under 10k words.
- Support tickets related to PDF export failures < 2 per month.
- No external API calls introduced by the feature.

## 9. Decisions
- Generate PDFs on demand with no caching layer; monitor burst load rather than persisting exports.
- Use fixed `A4` page size with 20 mm margins; defer configurability unless future enterprise requests surface.
- Embed PDF metadata fields — Title (summary title), Author (workspace/team), Subject (video title), Keywords (available tags/topics), Creator (app name and version).

# Tasks
## Relevant Files

- `server.js` - Hosts the forthcoming `/api/summary/:videoId/pdf` route.
- `server/markdown-to-html.js` - Shared renderer translating markdown summaries into HTML for Puppeteer.
- `server/pdf-renderer.js` - Puppeteer wrapper that streams PDF output.
- `src/App.tsx` - Current UI surface for saved summaries and download controls.
- `tests/pdf-route.test.ts` - Integration tests validating PDF responses and error states.
- `docs/prd-pdf-download.md` - Source requirements for the feature.

### Notes

- Puppeteer requires Chromium; capture deployment guidance for environments without GUI support.
- PDFs are generated on demand—no caching to disk unless added later.
- Ensure existing markdown downloads remain unaffected during rollout.

## Tasks

- [x] 1.0 Backend PDF Export Pipeline
  - [x] 1.1 Install and configure `puppeteer` and `markdown-it`; document Chromium download strategy.
  - [x] 1.2 Build shared markdown-to-HTML helper that mirrors client styling and syntax highlighting.
  - [x] 1.3 Implement PDF renderer utility that loads HTML, applies print styles, and returns `page.pdf()` output.
  - [x] 1.4 Expose `GET /api/summary/:videoId/pdf` route that streams PDFs with sanitized filenames.
  - [x] 1.5 Instrument logging and resilience around missing files, Puppeteer launch failures, and concurrent exports.

- [x] 2.0 Client UX Integration
  - [x] 2.1 Add "Download PDF" controls alongside markdown downloads in the saved summaries list/detail views.
  - [x] 2.2 Wire UI to the backend endpoint (e.g., `window.open` or fetch+blob) with correct filename handling.
  - [x] 2.3 Provide success/error toasts or inline status indicators for export attempts.

- [x] 3.0 Verification & Testing
  - [x] 3.1 Unit test markdown-to-HTML conversion (headings, lists, code blocks, callouts, links).
  - [x] 3.2 Add integration test for the PDF route verifying `application/pdf` headers and non-empty payloads.
  - [x] 3.3 Create manual QA checklist covering long summaries, embedded images/data URIs, and simultaneous export requests.

- [x] 4.0 Documentation & Operations
  - [x] 4.1 Update README/operations docs with PDF usage instructions and prerequisites.
  - [x] 4.2 Capture deployment notes for Puppeteer (sandbox flags, caching) in `ARCHITECTURE.md` or a new `docs/pdf-export.md`.
  - [x] 4.3 Communicate rollout plan and logging expectations to the team.
