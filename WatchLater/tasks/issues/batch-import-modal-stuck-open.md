# Batch import modal stays open after queue submission

## Summary
When the user submits a batch with valid YouTube links, the modal should close and surface a success toast. During QA (Playwright run on 2025-09-27) the modal remained open in front of the UI. A warning banner appeared and the queue cards rendered in the history panel, confirming the submission worked, yet the dialog never dismissed itself.

## Impact
- Breaks the expected flow documented in the Batch Import QA checklist, leaving users uncertain if the queue was created.
- Obscures the queue status cards; users must manually close the modal to monitor progress.
- Suggests state desync between the queue hook and modal controller, which could hint at broader event handling issues.

## Environment
- `npm run server` + `npm run dev` on commit `main` (Playwright Chromium 140).
- Local Supadata/Gemini credentials were absent, so items remained queued (see related issue on queue hangs).

## Reproduction steps
1. Open the Batch Import modal.
2. Paste three unique valid YouTube URLs.
3. Click `Queue 3 videos`.

### Observed
- Modal content stays visible; `Queue 3 videos` button is still enabled.
- No success toast appears.
- History drawer updates with new queued cards and the hero banner flips to "Batch import queue is running".

### Expected
- Modal closes automatically once submission succeeds.
- A toast confirms the import started.
- Batch import button returns to default (until re-opened by the user).

## Diagnostics
- `useBatchImportQueue.enqueue()` returns synchronously and the UI likely relies on a `requestClose()` callback tied to the success path. The queue updates imply the enqueue succeeded but the modal controller never received/handled the signal.
- No errors were logged in the browser console beyond the missing model warning.
- QA notes captured at `tasks/issues/batch-import-qa.md#L32`.

## Proposed fix
1. Audit the modal component (likely `BatchImportModal.tsx`) and ensure the submit handler awaits `enqueue` and invokes the provided `onComplete` / `onClose` callback on success.
2. Add defensive logic so that once a queue submission resolves, the modal forcibly dismisses even if downstream toast notification fails.
3. Add a regression test (React Testing Library or Playwright) that asserts the modal closes within a short timeout after clicking the submit button with valid inputs.

## Acceptance criteria
- Submitting valid URLs closes the modal automatically and shows the intended toast.
- Re-opening the modal after a submission shows an empty textarea (previous entries cleared).
- Automated test covers the success path to prevent regressions.

## Related
- `tasks/issues/batch-import-qa.md` — QA run documenting this behaviour alongside queue hang issues.
