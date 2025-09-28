# Batch Import QA Checklist

This playbook walks through the scenarios that exercised the new batch import workflow. Run it against a clean `npm run dev` + `npm run server` setup to validate the end-to-end experience.

## Setup
1. Clear local storage for `watchlater-batch-import-queue`.
2. Ensure the exports directory has no residual files you care about (tests create throwaway transcripts/summaries).
3. Launch the UI and API servers in separate terminals.

## Functional Checks
- **Single-shot validation**: open the Batch Import modal and paste a mix of valid/invalid URLs. Confirm the counter, inline errors, and duplicate flags update in real time; the Import CTA remains disabled until at least one valid URL is present.
- **Queue creation**: submit three valid, unique URLs. Expect the modal to close, a success toast to appear, and the history drawer to show three dashed "Queued" cards with status pills.
- **Sequential processing**: watch the queue cards roll through "Fetching metadata" → "Fetching transcript" → "Generating summary" → "Completed" for each video; the cards disappear and the saved summaries list inherits the new entries in order.
- **Failure and retry**: temporarily break network access (or edit `SUPADATA_API_KEY` to an invalid value) and enqueue a URL. Verify the queue card turns red, surfaces the error message, and exposes `Retry` and `Dismiss` buttons. Restore the key and retry to ensure the item succeeds.
- **Persistence**: reload the tab mid-process. Confirm queued/processing cards rehydrate with the latest stage and resume automatically.
- **Concurrency guard**: start a single URL summary and, while it is running, attempt to open the Batch Import modal or submit another single URL. The modal button should be disabled and the hero banner should warn that the batch queue is busy.
- **Stop controls**: while a batch is processing, click `Stop current` and confirm the active card flips to failed with "Stopped" text, the hero banner switches to "paused," and single-shot summaries are unblocked only after pressing `Resume`. Repeat with `Stop all` and ensure remaining queued cards fail with the stop message.
- **Watchdog recovery**: throttle or unplug the network so a batch item hangs. After ~90 seconds the queue should mark it as timed out, log the watchdog event, and keep the queue paused. Use `Retry stalled` to requeue the item and verify it processes once connectivity returns.

## Manual Edge Cases
- Paste more than ten URLs (11+) and ensure the modal blocks submission with an over-limit error.
- Include whitespace, blank lines, and clipboard noise—only real video IDs should survive dedupe.
- Queue the same video twice across sessions to confirm the second attempt is skipped with an appropriate toast.
- Trigger a Supadata or Gemini failure and inspect the console for the `[batch-import]` telemetry logs (enqueue, job-stage, job-failed/succeeded), verifying they carry useful metadata for monitoring.

Record outcome notes in the PRD task list after each run so regressions are easy to spot.
