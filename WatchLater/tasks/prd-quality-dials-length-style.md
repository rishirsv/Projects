# Quality Dials (Length × Style) PRD

## Introduction / Overview
Users currently edit prompt text manually to adjust summary tone or depth, which is cumbersome. This feature adds two lightweight "quality dials"—Length and Style—that map to curated prompt templates so users can switch modes without modifying code. We keep scope tight by limiting options to predefined combinations and by serving prompts from static markdown files.

## Goals
- Allow users to choose between Short, Medium, or Long summaries and Bullets or Narrative output styles.
- Persist each user’s selection locally so that single and batch runs share the same configuration.
- Serve prompt templates without introducing server-side complexity beyond reading static files.

## User Stories
- As a user preparing a quick recap, I want to choose a Short + Bullets mode so the summary highlights key points only.
- As a user creating in-depth documentation, I want a Long + Narrative mode so I receive full paragraphs automatically.
- As a batch user, I want queued jobs to respect my last chosen dial values so the output stays consistent without extra clicks.

## Functional Requirements
1. Add prompt files named `prompts/summary.<length>.<style>.md` for the six supported combinations.
2. Expose `GET /api/prompt?length=<short|medium|long>&style=<bullets|narrative>` that validates params, loads the corresponding file once, and caches it in memory.
3. The client settings store must track `length` and `style`, defaulting to `medium` and `bullets`, and persist selections in `localStorage`.
4. The main summary form and batch queue must request the prompt template via a shared helper before sending summaries to the server.
5. The batch pipeline must reuse the last fetched template per run rather than calling the API for every item.
6. The UI must show the active selections near the summary CTA and allow changing them with two segmented controls.
7. If template retrieval fails, the UI must display an inline error and fall back to the default template without blocking the run.

## Non-Goals
- Allowing arbitrary prompt editing or free-form template creation.
- Supporting more than six combinations or per-video overrides at launch.
- Persisting dial choices server-side or across different browsers.

## Technical Considerations
- Keep template files small and markdown-only; avoid remote fetches to maintain offline-friendly behavior during development.
- Implement a minimal caching layer on the server (e.g., `Map` keyed by `length-style`) to reduce filesystem reads.
- The client helper should debounce template re-fetching; only call the API when the combination changes.
- Ensure typings in `api.ts` limit length/style to the allowed strings to prevent unsupported permutations.

## Success Metrics
- Users can switch dial settings and begin a new summary in under two clicks.
- Batch runs respect chosen settings in 100% of manual QA cases.
- Support feedback shows reduced manual prompt edits after rollout (track via support tickets or TODO count).

## Open Questions
- Should the UI surface a short description explaining each mode to aid first-time users?
- Do we need analytics to understand which combinations are most popular before adding more options?
