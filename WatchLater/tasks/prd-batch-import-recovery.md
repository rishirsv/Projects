# Batch Import Pause / Resume & Recovery PRD

## Introduction / Overview
Extended batch imports can stall on bad links or API hiccups, forcing manual intervention. This feature equips the queue with pause, resume, stop-current, and recover controls while keeping the implementation simple by reusing the existing in-memory queue and persisting minimal state in `localStorage`.

## Goals
- Let users pause the queue without losing progress and resume later in the same browser session.
- Surface stuck items and allow retrying them without restarting the entire batch.
- Persist queue progress so a browser refresh can recover the latest state.

## User Stories
- As a user running a large batch, I want to pause processing when I notice repeated failures so I can inspect a problem before continuing.
- As a user whose browser crashed mid-run, I want the app to load and resume the remaining items automatically.
- As a user dealing with a single bad video, I want to stop the current item, skip it, and continue with the rest of the queue.

## Functional Requirements
1. Extend `useBatchImportQueue` (or equivalent module) with `pause()`, `resume()`, `stopCurrent()`, and `recover()` methods exposed to the UI.
2. When paused, the processor must stop dequeuing new items but remember the remaining queue.
3. `stopCurrent()` must cancel the active job, mark it as failed with the last error, and proceed to the next item when resumed.
4. Queue state (`items`, `status`, `attempts`, `lastError`, timestamps) must be serialized to `localStorage` whenever it changes and rehydrated on app load.
5. On load, the queue must compare stored state to disk exports (via existing file checks) to mark items already completed and remove them from the queue.
6. The UI must show per-item attempt counts and the most recent error message inline.
7. Provide a compact footer or panel indicating total items, completed count, paused status, and a "Recover Stalled" button.
8. The processing loop must mark items as "stalled" if they remain active longer than a configurable timeout (default 5 minutes) and expose them in the UI for manual recovery.

## Non-Goals
- Automatic retry backoff strategies beyond the existing simple retry logic.
- Server-side persistence of queue state or multi-client synchronization.
- Deep analytics dashboards; keep UI to essential controls and status indicators.

## Technical Considerations
- Implement pause/resume as an in-memory boolean flag checked before dequeuing new work; avoid complex token systems.
- Use `AbortController` or existing cancellation utilities to stop the current job cleanly.
- To detect completions, reuse current file naming conventions (e.g., summary JSON or PDF) when reconciling with disk.
- Ensure localStorage writes are throttled (e.g., via `requestIdleCallback` or debounced updates) to prevent performance hits during large batches.
- When recovering, requeue stalled items at the front but cap retries to avoid infinite loops.

## Success Metrics
- Pause/resume operations respond within 1 second of user action.
- After a forced browser refresh, at least 95% of test runs resume processing automatically without manual re-import.
- Users report fewer abandoned batch jobs due to unhandled stalls in support feedback.

## Open Questions
- What default timeout should we use to mark an item as stalled, and should it adjust based on model or video length?
- Do we need a "Skip permanently" control for items that repeatedly fail, or is manual deletion sufficient?
