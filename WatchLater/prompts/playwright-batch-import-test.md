# Playwright MCP Testing Prompt — Batch Import QA

You are a junior developer helping validate the WatchLater batch import flow using the Playwright MCP toolchain. Follow the steps below exactly and report your findings.

1. **Environment Prep**
   - Confirm `npm ci` has been run in `WatchLater/` and the dev server is available on `http://localhost:5173` with the API on `http://localhost:3000`.
   - Clear browser storage for the WatchLater origin before each test run to avoid stale queue state.

2. **Playwright MCP Session**
   - Launch a new Playwright MCP session targeting Chromium in headless mode.
   - Set the base URL to `http://localhost:5173` and ensure requests to the API proxy correctly.

3. **Test Objectives**
   - Open the batch import modal, paste the sample URLs below, and assert that the import CTA toggles enabled/disabled based on validation feedback.
   - Submit the queue, wait for the success toast (`/videos queued/i`), and confirm the modal closes automatically.
   - Reopen the modal and verify the textarea is reset to empty.
   - Capture telemetry events emitted to the console (`[batch-import]` prefix) while the queue processes.
   - Validate watchdog heartbeats by stubbing timers or waiting until at least one heartbeat log appears for the active item.

4. **Sample URL Fixture**
   ```text
   https://youtu.be/video-one
   https://www.youtube.com/watch?v=video-two
   ```

5. **Assertions to Encode**
   - `data-testid="toast-success"` element appears with copy matching `/queued/i`.
   - No `.batch-import-modal` nodes remain after submission.
   - Console contains `job-heartbeat` entries with increasing `stageElapsedMs` values.
   - Queue history list gains two items with `.status-pill` text matching `/completed/i`.

6. **Reporting**
   - Provide the Playwright MCP run log, including screenshots on failure.
   - Summarize outstanding gaps (e.g., retries, stop controls) separately so they can be automated later.

Do not modify application source during this assignment—only interact through Playwright MCP scripts.
