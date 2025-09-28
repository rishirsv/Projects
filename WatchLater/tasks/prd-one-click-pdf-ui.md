# One-Click PDF Download PRD

## Introduction / Overview
The server already exposes a PDF endpoint, but users must call it manually. This feature adds visible "Download PDF" controls next to saved summaries, wiring them to the existing route so downloading takes a single click with helpful feedback on failures.

## Goals
- Surface a Download PDF button wherever a summary is shown post-generation.
- Automatically use the server-provided filename when saving the PDF locally.
- Provide clear success/failure feedback without introducing new backend dependencies.

## User Stories
- As a user reviewing a freshly generated summary, I want to click a button and receive the PDF version immediately.
- As a user browsing the Library, I want to download any previously saved summary without reopening developer tools or editing URLs.
- As a user encountering an error while downloading, I want to see what went wrong so I can retry or report the issue.

## Functional Requirements
1. Add a `Download PDF` button to the summary success screen and to each row in the Library/History list.
2. Clicking the button must call `GET /api/summary/:videoId/pdf` using the existing API helper.
3. The client must parse the `Content-Disposition` header to determine the filename, defaulting to `resolveSummaryPdfFilename` when absent.
4. Successful responses must trigger a browser download using Blob URLs; no new server endpoints are required.
5. Failures must display a toast or inline error summarizing the HTTP status and reason.
6. The button must display a loading state while the download is in progress to prevent duplicate clicks.

## Non-Goals
- Editing PDF contents or customizing PDF layouts.
- Queuing multiple downloads or bundling PDFs into archives.
- Persisting download history or metrics server-side.

## Technical Considerations
- Reuse the existing `api.ts` scaffolding for filename parsing; ensure TypeScript typings handle the optional header gracefully.
- Debounce repeated clicks by disabling the button until the request resolves.
- Confirm CORS headers on the existing endpoint already allow browser downloads; adjust only if QA finds issues.

## Success Metrics
- Users can download a PDF within two clicks from both the success screen and Library view.
- QA confirms filename parity between the downloaded file and server metadata in 100% of test cases.
- Support reports zero manual instructions needed for PDF retrieval post-launch.

## Open Questions
- Should the Library show a tooltip or icon-only button for PDF to keep the table compact?
- Do we need to surface download progress for larger PDFs, or is a simple loading state sufficient?
