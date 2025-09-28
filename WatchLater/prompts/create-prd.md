# PRD: WatchLater UI Decomposition (Low‑Risk Refactor)

## 1) Summary
- Refactor the monolithic `src/App.tsx` into a small set of presentational components and tiny UI hooks without moving business logic yet.
- Preserve current behavior and markup while improving readability, separation of concerns, and developer velocity for future UI changes.
- Scope is intentionally minimal: extract rendering and localized UI state; keep async flows, queue orchestration, and side effects in `App` for now.

## 2) Problem Statement
`src/App.tsx` (~1.4k lines) centralizes UI rendering, async handlers, batch orchestration, modals, and toasts. This increases cognitive load, slows UI iteration, and raises regression risk. We need a low‑risk split that makes UI changes easier without re‑architecting data flow.

## 3) Goals
- Maintain identical UX (no visual or behavioral changes).
- Shrink `src/App.tsx` by moving heavy render trees into components.
- Reduce unnecessary re‑renders by isolating heavy subtrees (e.g., markdown, history, queue list).
- Keep all business logic and effects in `App` to minimize risk.
- Create clear seams for future changes (feature components + typed props).

## 4) Non‑Goals
- No route/state management overhaul (no Redux/Zustand/Router changes).
- No API changes or backend work.
- No CSS restyling beyond moving JSX (classNames/ARIA remain the same).
- No batch processor reimplementation (registration/effects remain in `App`).

## 5) User Experience
- Expected result: identical screens, flows, keyboard/focus behavior, and performance characteristics.
- Likely improvement: fewer unnecessary re‑renders → snappier typing and smoother updates.

## 6) Architecture & Decomposition
Keep `App` as the orchestrator that owns:
- State: URL, status/stages, active model ID, pdf/toast state, saved summaries, delete modal state, batch queue state.
- Effects/handlers: fetch/save/generate flows, queue processor registration, deletion, download/copy, modal lifecycle.
- Composition: renders the new components with props and callbacks.

Extract the following presentational components (PascalCase, kebab‑case filenames):

1) components/ProgressPipeline.tsx
- Purpose: Render the 4 pipeline stages grid and status pill.
- Props:
  - `stages: { id: number; title: string; description: string; }[]`
  - `currentStage: number`
  - `status: 'idle'|'processing'|'complete'|'error'`

2) components/SummaryActions.tsx
- Purpose: Action buttons + `ModelSelector` row.
- Props:
  - `summary?: SummaryData | null`
  - `pdfState: PdfExportState`
  - `onDownloadMd(): void`
  - `onDownloadPdf(): void`
  - `onCopy(): void`
  - `onRegenerate(): void`
  - `onOpenFolder(): void`

3) components/SummaryViewer.tsx
- Purpose: Title/author, summary markdown, key takeaways, tags, transcript toggle.
- Props:
  - `summary: SummaryData | null`
  - `showTranscript: boolean`
  - `onToggleTranscript(open: boolean): void`

4) components/HistoryPanel.tsx
- Purpose: Saved summaries list + batch queue controls/rows.
- Props:
  - Saved list: `items: SavedSummary[]`, `loading: boolean`, `onRefresh(): void`, `onSelect(item: SavedSummary): void`, `onDelete(item: SavedSummary, title: string): void`
  - Queue: `queueItems: BatchQueueItem[]`, `stats`, `isStopRequested: boolean`, `activeItem: BatchQueueItem | null`,
    `onStopActive(): void`, `onStopAll(): void`, `onResume(): void`, `onRecover(): void`,
    `onRetry(item: BatchQueueItem): void`, `onDismiss(item: BatchQueueItem): void`
- Optional subcomponent: `components/QueueItem.tsx` for a single queue row.

5) components/DeleteModal.tsx
- Purpose: Controlled clear‑all/single delete confirmation dialog.
- Props:
  - `state: DeleteModalState`
  - `error?: string`
  - `onCancel(): void`
  - `onConfirm(): void`
  - `onChangeInput(value: string): void`
  - `onToggleIncludeTranscripts?(checked: boolean): void`
  - `onToggleDeleteAllVersions?(checked: boolean): void`

6) components/Toast.tsx
- Purpose: Toast host for transient success/error messages.
- Props: `{ toast: ToastState | null }`

7) components/SignalGlyph.tsx
- Purpose: Header SVG logo.
- Props: `{ animated: boolean }`

Optional tiny hooks (pure UI concerns):
- hooks/useToast.ts: manages `{ toast, showToast }` and 4s auto‑dismiss.
- hooks/usePdfExport.ts: manages `{ pdfState, setPdfState }` and success auto‑reset.

Optional utilities consolidation:
- utils/summary.ts: `composeSummaryDocument`, `extractKeyTakeaways`, `extractHashtags`, `formatKilobytes`.
- types/summary.ts: `SummaryData`, `SavedSummary`, `PdfExportState`, `DeleteModalState`, `ToastState`, `Stage`.

Performance notes:
- Wrap heavy components with `React.memo` (`SummaryViewer`, `HistoryPanel`).
- Pass stable callbacks (`useCallback`) and stable data (`useMemo`) from `App` (already present).

Accessibility notes:
- Preserve existing markup, roles (`role="dialog"`, `aria-live="polite"`, etc.), `title` attributes, and focus handoff (`requestAnimationFrame` on Batch modal close).

## 7) Scope of Work
- Create the new components with JSX moved 1:1 from `App`, preserving classNames and semantics.
- Wire props to existing `App` handlers/state; do not change handler logic.
- Do not alter API calls or server endpoints.
- Optional: extract the tiny hooks + utils/types as a second pass.

## 8) Deliverables
- New files under `src/components/`: `ProgressPipeline.tsx`, `SummaryActions.tsx`, `SummaryViewer.tsx`, `HistoryPanel.tsx`, `DeleteModal.tsx`, `Toast.tsx`, `SignalGlyph.tsx` (and optionally `QueueItem.tsx`).
- Optional new files under `src/hooks/`: `useToast.ts`, `usePdfExport.ts`.
- Optional new files under `src/utils/`: `summary.ts`.
- Optional new files under `src/types/`: `summary.ts`.
- Slimmed `src/App.tsx` composing the extracted components.

## 9) Acceptance Criteria
- UX parity: identical visuals and behaviors across all flows.
- All existing tests pass: `npm test -- --runInBand`.
- Lint passes: `npm run lint`.
- Manual validation checklist (see Section 11) passes.
- No TypeScript errors in app build: `npm run build`.

## 10) Implementation Plan (Phased)
Phase A – Core component extraction (no logic moves):
1. Extract `SignalGlyph` and `Toast` (smallest, zero risk).
2. Extract `ProgressPipeline`.
3. Extract `SummaryActions` (keep `ModelSelector` inside it).
4. Extract `SummaryViewer` (ReactMarkdown, tags, transcript toggle).

Phase B – Right column & modals:
5. Extract `HistoryPanel` (initially inline queue item rows).
6. Extract `DeleteModal`.
7. Optional: extract `QueueItem` from `HistoryPanel`.

Phase C – UI hooks + utils/types (optional, still low risk):
8. Extract `useToast` and `usePdfExport` hooks; replace in `App`.
9. Move utility functions to `utils/summary.ts` and types to `types/summary.ts`; update imports.

Each phase should build and run green (lint/tests) before proceeding.

## 11) Validation & Test Plan
Automated
- Run existing Jest suites: queue logic, renderer output, API expectations.
- Ensure no snapshot/DOM regressions if present; otherwise add small unit tests for new components where trivial.

Manual QA
- Paste YouTube URL → pipeline stages 1→4 update, summary renders.
- Cancel mid‑processing; status resets.
- Regenerate summary (same URL) works and updates saved file.
- Download Markdown and PDF; PDF shows success feedback.
- Copy to clipboard works; no console errors.
- Toggle transcript; persists open state while visible.
- Open batch import modal; closing returns focus to trigger.
- Queue controls: stop current, stop all (confirm), resume, retry stalled.
- History refresh; selecting an item loads summary; delete single and clear all confirm flows.
- Toast shows for 4s and auto‑hides.
- ARIA roles/labels present as before; no a11y regressions.

## 12) Risks & Mitigations
- Prop drift/typos when wiring: use TypeScript types centralization and strict props.
- Re‑render patterns change: apply `React.memo` on heavy components; keep callbacks stable.
- Focus management in modals: preserve current `requestAnimationFrame` refocus.
- Missed className/selector → CSS mismatch: copy JSX verbatim; do not rename classes.

## 13) Timeline (estimates)
- Phase A: 0.5–1 day
- Phase B: 0.5–1 day
- Phase C (optional): 0.5 day
Total: 1–2 days (core), +0.5 day (optional extras)

## 14) Rollout & Backout
- Rollout: land Phase A as PR 1; ship. Phase B as PR 2; ship. Phase C optional PR 3.
- Backout: revert the last PR only (components are isolated and 1:1 with existing markup).

## 15) Success Metrics
- Developer: time to add a UI change in summary/history panels decreases; fewer merge conflicts in `App`.
- Technical: reduction of `src/App.tsx` line count by >50%; no increase in bug reports; no perf regressions.

## 16) Open Questions
- Do we want to extract batch processor logic next (`hooks/useBatchProcessor.ts`)? Deferred.
- Should `SummaryActions` own `ModelSelector`, or should it be a sibling in the header? Initial pass: keep it inside for simplicity.
- Do we want component tests now or rely on existing integration tests? Initial pass: rely on existing; add tests where cheap.

## 17) PR Checklist (per repo guidelines)
- Commits: `refactor(ui): extract {ComponentName}`; wrap body at ~72 chars.
- Update docs if any developer‑facing usage changes (none expected).
- Run: `npm ci && npm run lint && npm test -- --runInBand && npm run build`.
- Attach screenshots are not required (no visual changes), but include before/after structure diff of `src/` component tree.
 
## 18) Tasks (Operational Checklist)
- See also `prompts/create-tasks.md`. Filenames are kebab-case per repo conventions.

Pre‑flight
- [ ] Ensure clean working tree; create a feature branch.
- [ ] `npm ci` (once), then `npm run lint`, `npm test -- --runInBand`, `npm run build`.

Phase A — Core components (no logic moves)
- [ ] Extract `src/components/signal-glyph.tsx` and replace inline SVG.
- [ ] Extract `src/components/toast.tsx` and render via `{toast}` prop.
- [ ] Extract `src/components/progress-pipeline.tsx` with props `{ stages, currentStage, status }`.
- [ ] Extract `src/components/summary-actions.tsx` with props `{ summary, pdfState, onDownloadMd, onDownloadPdf, onCopy, onRegenerate, onOpenFolder }` and include `ModelSelector`.
- [ ] Extract `src/components/summary-viewer.tsx` with props `{ summary, showTranscript, onToggleTranscript }` and wrap with `React.memo`.

Phase B — Right column & modal
- [ ] Extract `src/components/history-panel.tsx` (saved list + queue controls/rows). Consider `src/components/queue-item.tsx`.
- [ ] Extract `src/components/delete-modal.tsx` with full controlled props and preserve ARIA/focus.

Phase C — Optional UI hooks + utils/types
- [ ] `src/hooks/use-toast.ts` → `{ toast, showToast }` + 4s auto‑dismiss.
- [ ] `src/hooks/use-pdf-export.ts` → `{ pdfState, setPdfState }` + success auto‑reset.
- [ ] `src/utils/summary.ts` → move small helpers. `src/types/summary.ts` → centralize types.

Validation
- [ ] `npm run lint` · `npm test -- --runInBand` · `npm run build` pass.
- [ ] Manual QA checklist passes (see PRD Section 11).

Rollout
- [ ] PR 1 (Phase A), PR 2 (Phase B), PR 3 optional (Phase C). Backout by reverting the last PR.
