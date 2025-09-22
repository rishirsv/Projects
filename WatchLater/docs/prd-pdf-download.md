# PRD — PDF Download for Saved Summaries

_Updated: 2025-09-20_

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
- **Decided**: Provide a `SKIP_PDF_RENDER=true` escape hatch for automated tests; real environments run Puppeteer.
- **Decided**: Generate PDFs on demand with no caching layer; monitor burst load rather than persisting exports.
- **Decided**: Use fixed `A4` page size with 20 mm margins; defer configurability unless future enterprise requests surface.
- **Decided**: Embed PDF metadata fields — Title (summary title), Author (workspace/team), Subject (video title), Keywords (available tags/topics), Creator (app name and version).
