# Model Fallback (Optional, Light) PRD

## Introduction / Overview
Occasional model outages or quota limits cause summaries to fail. This feature adds an optional secondary model fallback so transient errors trigger one automatic retry with a different provider, reducing manual restarts while keeping logic straightforward.

## Goals
- Allow configuration of a backup model for select primary models without expanding into complex routing policies.
- Retry failed summary generation once with the fallback model when errors are retryable.
- Clearly communicate to users when a fallback model produced the final summary.

## User Stories
- As a user running a batch, I want the system to retry failed items with a backup model so long queues finish without intervention.
- As a single-run user encountering a transient error, I want the app to recover automatically and show me which model generated the result.
- As an operator, I want to toggle fallback behavior per model via configuration without redeploying code.

## Functional Requirements
1. Extend the model registry/config to allow entries with `fallbackModelId` and enable/disable flags.
2. Update `generateSummary()` (and transcript flow if needed) to catch retryable errors (rate limits, 5xx) and attempt the fallback model once.
3. When fallback succeeds, attach metadata (e.g., `usedFallback: true`, `fallbackModelId`) to the saved summary and responses.
4. The client UI must display a subtle "Used fallback: <model name>" badge on the summary result and in the Library.
5. If both primary and fallback fail, surface the combined error to the user without masking the original cause.
6. Provide configuration to disable fallback globally or per model (e.g., via `.env` or config file) so operators can opt out.

## Non-Goals
- Multi-hop fallback chains or adaptive model selection.
- Automatic retries for non-retryable errors (e.g., invalid API keys, content policy violations).
- Adding new UI toggles for end users; fallback remains an operator-level setting.

## Technical Considerations
- Define a clear list of retryable error codes/messages to avoid retry storms.
- Ensure the fallback attempt shares the same prompt and transcript payload to keep outputs comparable.
- Log fallback events server-side with enough detail (model IDs, error type) for monitoring.
- Update tests to cover primary success, fallback success, and dual failure scenarios.

## Success Metrics
- Batch runs that previously failed due to transient model errors now complete at least 80% of the time in internal testing.
- Support tickets related to single-model outages decrease after rollout.
- No more than one additional second of latency is introduced for successful primary runs (fallback only triggers on failures).

## Open Questions
- Which models should ship with fallback mappings by default (e.g., Gemini Flash → OpenRouter fast tier)?
- Do we need telemetry to monitor fallback usage trends before expanding support?
