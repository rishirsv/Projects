# Batch import queue can hang; add global Stop control

## Summary
When a batch import is running, the queue sometimes stalls with items stuck in `processing` or `queued`. While stalled, single-summary runs are held by design, so the user is blocked. We need: (1) a clear root-cause analysis with repro notes, and (2) a robust "Stop batch" control that reliably terminates an in-flight batch under all conditions and allows recovery.

## Current implementation (quick map)
- Queue lives client-side in `src/hooks/useBatchImportQueue.ts` with persistence to `localStorage` under `watchlater-batch-import-queue`.
- Processing is single-threaded: `processNext()` promotes first `queued` item → `processing` and invokes a registered `processor` from `App.tsx`.
- App wires the processor that runs: `fetchVideoMetadata` → `fetchTranscript` → `saveTranscript` → `generateSummaryFromFile` with stage updates.
- A pause mechanism exists via `setProcessingHold(token, shouldHold)` that uses a token set to pause/resume the loop (used to block single runs while a batch is active and vice versa). No explicit cancel/abort of the active job exists.
- Completion/Failure paths mark the item and then tail-call `processNext()`.

## Likely hang vectors
1) Missing network timeouts/abort signals
- `src/api.ts` uses bare `fetch(...)` for all server calls (metadata, transcript, save, summary, pdf). There are no per-request timeouts or `AbortController`s. If the backend or network stalls, a Promise may remain pending indefinitely, leaving the active queue item in `processing` forever.

2) Unhandled hang in processor prevents queue release
- The queue hook sets `isProcessingRef` true before invoking the processor and only resets it in `.finally()` attached to the processor Promise. If the processor never resolves/rejects (e.g., hung fetch), `isProcessingRef` stays true, preventing `processNext()` from advancing.

3) Pause/hold tokens not cleared in atypical flows
- The hold mechanism is token-based and appears sound, but if a UI path were to set a hold and not clear it, the queue can remain paused. Lower probability, but worth defensive handling.

4) Persisted `processing` normalization only on reload
- On load, `sanitizeQueueState` coerces any `processing` items back to `queued` so a refresh can recover. During a long session without reload, a wedged Promise won’t self-recover.

## Reproduction notes
- Start a batch with multiple videos and introduce a backend delay (throttle network, or pause the Express server mid-request).
- Observe: queue item reaches `processing` and stops advancing; banner blocks single-summary runs; no auto-timeout occurs.

## Diagnostics (from code)
- `useBatchImportQueue.processNext()` sets `isProcessingRef.current = true` and relies on the processor’s resolution to reset it and call `processNext()` again.
- No watchdog exists to bound stage or item wall time.

## Fix plan

### 1. Reproduce and instrument
- Add storybook/dev toggle or CLI flag to simulate slow/hung requests (e.g., middleware that delays responses) so hangs are repeatable.
- Capture additional queue diagnostics (timestamps for `stage` transitions, last error) in dev logs to confirm which stage stalls first.

### 2. Make API calls abortable and time bound
- Introduce `fetchWithTimeout` helper that wraps `fetch` with `AbortController` and a configurable timeout.
- Update every multi-step request in `src/api.ts` to accept an optional `AbortSignal`, supply stage-specific timeouts, and convert low-level aborts into actionable errors for the queue.
- Store the active controller on the queue item so Stop/timeout paths can cancel the in-flight work.

### 3. Harden queue state machine
- Track `startedAt` and `stageUpdatedAt` timestamps per item.
- Add a watchdog in `useBatchImportQueue` that fails an item with `error: 'Timeout exceeded'` if it remains `processing` longer than a configurable limit, resetting `isProcessingRef` so the queue advances.
- Ensure pause tokens cannot keep the queue in a blocked state after a cancellation by force-unlocking on timeout/stop events.

### 4. Ship Stop / Stop All controls
- Extend the hook with `stopActive()` and `stopAll()` APIs that clear queued items, abort the current controller, and emit `logQueueEvent` entries.
- Surface buttons in the batch panel banner with confirmation and post-action feedback; leave remaining queued items for resume unless "Stop All" is chosen.
- When stopping, mark the current item as `failed` with a descriptive error and optionally enqueue it back to `queued` if the user wants to retry.

### 5. Provide manual recovery affordance
- Expose `recoverStalled()` that re-queues an item stuck in `processing` after watchdog intervention; surface this in the UI as a "Retry stalled item" toast action.

### 6. Test coverage & docs
- Add Jest tests that simulate a hanging processor (Promise never resolves) to ensure watchdog + Stop button recover the queue.
- Write integration-style tests for the new controls (click Stop → queue idles, single summary unblocks).
- Document timeout/stop behaviour in `/docs/batch-import.md`, including guidance for adjusting thresholds via env vars.

## Acceptance criteria
- Batch cannot block single runs indefinitely: jobs either complete, fail, or can be stopped.
- Stop button is visible when queue has pending items and works immediately.
- Network hangs are bounded by timeouts and/or cancelled via AbortController.
- Refresh-free recovery path exists for stuck items.

## Risks
- Aborting mid-write: ensure server endpoints write atomically (temp + rename) and are idempotent.
- Timeouts in high-latency environments: make thresholds configurable via env or UI.

## Next steps (no code changes yet)
1. Add `fetchWithTimeout` and retrofit `api.ts`.
2. Extend `BatchProcessorControls` with abort plumbing; expose `stopActive()`/`stopAll()` from the hook.
3. Add Stop UI in `App.tsx` with confirmations.
4. Add tests: simulated hang → Stop marks failed and advances; watchdog timeout path.
