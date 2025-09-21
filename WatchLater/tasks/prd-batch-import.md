# PRD — Batch Import Pipeline

## 1. Introduction / Overview
Add a batch import workflow that lets power users queue up to ten YouTube videos at once. The feature should accept multiple URLs, create pending transcript entries, and progressively generate transcripts and summaries without requiring manual monitoring. Pending items must surface in the existing transcript library so users can track progress alongside their saved summaries.

## 2. Goals
- Provide a dedicated "Batch Import" entry point in the toolbar that matches the existing purple gradient styling.
- Allow pasting and validating up to ten YouTube URLs in a single submission, preventing duplicates and bad links.
- Surface each queued video in the transcript library with clear status indicators for pending, processing, success, and failure states.
- Process transcripts automatically using the existing Supadata + Gemini pipeline while keeping the UI responsive.

## 3. User Stories
| ID     | As a…         | I want to…                                              | So that…                                                |
|--------|---------------|----------------------------------------------------------|---------------------------------------------------------|
| BI-1   | heavy user    | Paste a list of video URLs and import them all at once   | I avoid repeating the single-URL workflow ten times.    |
| BI-2   | multitasker   | See queued items in the transcript library while they run| I know what is processing and can plan my next actions.  |
| BI-3   | analyst       | Know when any URL fails and why                          | I can retry or replace the failed video quickly.        |
| BI-4   | accessibility | Have in-progress summaries visually distinguished        | I do not confuse incomplete content with ready items.   |

## 4. Functional Requirements
1. Add a "Batch Import" button to the top toolbar (desktop + mobile) using the existing gradient treatment, with hover/focus states consistent with other primary actions.
2. Clicking the button opens a centered modal dialog with gradient styling, a multi-line input (up to 10 URLs), validation feedback, and an "Import" call-to-action.
3. The modal input must accept pasted text, strip whitespace, deduplicate entries, and validate each URL against the YouTube ID regex (`extractVideoId`). Invalid entries trigger inline error cues and block submission until resolved or removed.
4. Display a real-time counter in the modal (e.g., "6 / 10 URLs ready") and disable the import button when zero valid URLs are present or the count exceeds ten.
5. On submission, enqueue each valid URL. Close the modal, reset the input, and show a toast confirming the number of imports queued. Leave the modal open with errors highlighted if all URLs are invalid.
6. Inject each queued video into the transcript library panel using the existing card layout, marked with a "Queued" status badge, grayed-out thumbnail/title styles, and disabled action buttons until processing completes.
7. A batch processor runs in the background: fetch video metadata, request transcripts through Supadata, and persist results just like the single URL flow. Limit active jobs to one at a time (configurable for future tuning) to avoid Supadata/Gemini rate overruns.
8. Update card states as the queue progresses: "Fetching transcript", "Generating summary", "Complete" (with timestamp) or "Failed" (with retry affordance). Completed items unlock the existing actions (open summary, download, delete).
9. Failed jobs record the error message (Supadata/Gemini/validation) and offer a retry button that re-queues the specific video.
10. Persist queue state in local storage so refreshing the page keeps pending/processing items visible until they finish or fail.
11. Ensure batch imports integrate with existing exports/transcript storage (no duplicate files; re-use sanitized filenames) and do not disrupt manual single URL processing.

## 5. Non-Goals
- Importing from CSV files or external playlists (manual paste only).
- Increasing the maximum queue size beyond ten URLs per submission.
- Concurrent Gemini summary generation tuning beyond the initial single-job processing.
- Advanced scheduling (e.g., run later, pause queue).

## 6. Design Considerations
- Modal and button must align with the current purple gradient system, glassmorphism background, and rounded pill aesthetics.
- Provide accessible focus states and maintain color contrast for grayed-out queued cards.
- In the transcript library, clearly distinguish queued/processing cards (monochrome or opacity), and use iconography (spinner, check, warning) consistent with existing stage indicators.
- Ensure the modal is keyboard-navigable, supports paste via Cmd/Ctrl+V, and includes a shortcut to clear invalid lines.
- For small screens, consider full-screen modal presentation with sticky actions.

## 7. Technical Considerations
- Build a lightweight queue manager in the client that sequences jobs, persists state (localStorage key `batch-import-queue`), and resumes jobs after refresh.
- Reuse `fetchVideoMetadata`, `fetchTranscript`, `saveTranscript`, and `generateSummaryFromFile` APIs, respecting existing error handling.
- Guard against repeated Supadata calls for the same video within a queue (dedup by videoId before dispatch).
- Consider API throttling/backoff when Supadata or Gemini returns rate-limit responses; requeue with exponential delay.
- Provide instrumentation hooks (console or future telemetry) for queue length, average duration, and failure reasons to aid QA.

## 8. Success Metrics
- 90% of batch imports (10 URLs) complete within 15 minutes on a typical residential connection.
- < 5% of queued URLs fail due to validation or network issues on first attempt.
- ≥ 75% of early adopters prefer batch import (survey or feedback channel) for processing multiple videos.
- Zero regressions in single-URL processing as measured by smoke tests.

## 9. Open Questions
- Should completed items automatically trigger summary generation, or just transcript fetch? (Currently assumes full pipeline.)
- Do we limit batches to one active queue per user session, or allow multiple overlapping batches?
- Is there a need for progress notifications (sound, desktop notification) when all imports finish?
- How should we handle extremely long transcripts or Gemini quota exhaustion mid-batch?

# Tasks
## Relevant Files
- `src/App.tsx` — Toolbar actions, transcript library rendering, queue state management.
- `src/components/BatchImportModal.tsx` — Batch import modal UI, validation, and submit handling.
- `src/api.ts` — API helpers for transcript/summary generation; may need new batch orchestration helpers.
- `src/App.css` — Styles for toolbar button, modal, and queued-card states.
- `prompts/` — Update templates if new copy or CTA text is introduced.
- `tests/` — Add coverage for queue manager logic and UI state transitions.
- `docs/` — Document batch import usage, limitations, and troubleshooting.

## Task Breakdown
- [ ] 1.0 UX & Interaction
- [x] 1.1 Add "Batch Import" toolbar button with responsive layout.
- [x] 1.2 Implement modal dialog (gradient background, instructions, validation messaging).
  - [ ] 1.3 Introduce transcript library card states for queued/processing/failed videos.

- [ ] 2.0 Queue & Processing Logic
  - [ ] 2.1 Build client-side queue manager (enqueue, dedupe, persist, resume).
  - [ ] 2.2 Integrate queue with existing metadata/transcript/summary APIs.
  - [ ] 2.3 Implement retry and failure handling (including exponential backoff for transient errors).

- [ ] 3.0 Persistence & Storage
  - [ ] 3.1 Persist queue state to localStorage and reconcile on load.
  - [ ] 3.2 Ensure saved transcripts/summaries reuse sanitized filenames without duplicates.
  - [x] 3.3 Guard against simultaneous single-URL and batch conflicts (locking or scheduling strategy).

- [ ] 4.0 Testing & QA
  - [ ] 4.1 Add Jest tests for queue manager (enqueue, dedupe, status transitions).
  - [ ] 4.2 Write integration tests simulating batch import flows (success, mixed failure, retry).
  - [ ] 4.3 Produce manual QA script covering invalid URLs, partial batches, refresh mid-process, and concurrency with single URL flow.

- [ ] 5.0 Documentation & Rollout
  - [ ] 5.1 Update README/docs with batch import instructions and limitations.
  - [ ] 5.2 Note monitoring/logging expectations for batch processing.
  - [ ] 5.3 Communicate rollout plan and collect feedback from early users.

## Implementation Task Checklist

- [x] 1.0 Add Batch Import entry point in the toolbar
- [x] 1.1 Create a gradient-styled "Batch Import" button within the toolbar, matching existing hover/focus behaviors.
- [x] 1.2 Ensure the button layout adapts for mobile/desktop breakpoints without crowding existing controls.
- [x] 1.3 Wire the button click handler to invoke the batch import modal and manage open/close state.

- [x] 2.0 Build the Batch Import modal with URL validation UX
- [x] 2.1 Implement a modal component that follows purple gradient/glassmorphism styling with accessible focus management.
- [x] 2.2 Add a multi-line input that trims whitespace, deduplicates entries, and constrains submissions to ≤ 10 URLs.
- [x] 2.3 Integrate `extractVideoId` validation, inline error messaging, and a live counter ("n / 10 URLs ready").
- [x] 2.4 Disable the import CTA unless valid URLs exist and reset modal state after successful submission or cancellation.

- [ ] 3.0 Implement the client-side batch queue manager
- [x] 3.1 Create a queue controller (hook or module) that tracks queued, processing, completed, and failed states per videoId.
  - [x] 3.2 Persist queue state to `localStorage` and hydrate it on load so refreshes retain progress.
  - [x] 3.3 Schedule jobs sequentially (one active request) with hooks for pausing/resuming and detecting duplicates across batches.

- [ ] 4.0 Integrate queued videos with transcript pipeline and persistence
  - [ ] 4.1 For each queued item, call metadata → transcript → summary helpers and reuse existing save flows.
  - [ ] 4.2 Update transcript library cards to reflect queue states (queued, fetching, generating, success, failed) and lock actions until complete.
  - [ ] 4.3 Surface failure reasons, allow per-item retry, and ensure sanitized filenames prevent duplicate exports.

- [ ] 5.0 Verify, document, and roll out the Batch Import workflow
  - [ ] 5.1 Add unit/integration tests covering queue transitions, modal validation, and UI state updates.
  - [ ] 5.2 Draft manual QA steps (invalid URLs, partial batches, refresh mid-run, concurrency with single import) and update docs/README.
  - [ ] 5.3 Capture logging or telemetry hooks for queue length, duration, and failure counts to monitor roll-out.
