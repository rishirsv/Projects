# Refactor App.tsx to extract presentational components

**Status:** Completed (App orchestrator now composes components under `src/components/` as of refactor/app-split-rishi)

## Summary
`src/App.tsx` currently owns every piece of UI markup for WatchLater's Phase 3 interface. The file exceeds 1.4k lines, mixes heavy JSX with orchestration logic, and makes targeted testing or styling adjustments risky. We should follow the UI decomposition plan to extract render-only components while keeping business logic inside `App`.

## Current implementation
- `src/App.tsx` renders header, hero form, progress pipeline, summary card, history list, delete modal, and toast inline
- UI-specific helpers (SVG glyph, markdown composition, file size formatting) live in the same file as API/effect handlers
- Toast/PDF export timers rely on manual `useRef` cleanup logic inside `App`
- Shared types (`SummaryData`, `SavedSummary`, `PdfExportState`, etc.) are declared locally instead of a reusable module

## Problem analysis
1. **Maintainability** – 1.4k lines of interwoven logic + JSX slow down review cycles and discourage incremental changes
2. **Testability** – Presentational seams for pipeline, summary viewer, and history list are hard to exercise in isolation
3. **Performance** – Without memoized subtrees, any state change forces the entire render tree to reconcile
4. **Type reuse** – Duplicated type declarations prevent components/tests from importing canonical definitions
5. **State hygiene** – Timeout refs for toasts/PDF export complicate cleanup and duplicate logic across handlers

## Fix plan
1. Extract render-only components under `src/components/`
   - `SignalGlyph.tsx` for the SVG logo animation
   - `Toast.tsx` to encapsulate transient message styling
   - `ProgressPipeline.tsx` for the four-stage status grid
   - `SummaryActions.tsx` for the action toolbar + `ModelSelector`
   - `SummaryViewer.tsx` for summary metadata, markdown content, tags, and transcript toggle (memoized)
   - `HistoryPanel.tsx` for the right column list view (memoized)
   - `DeleteModal.tsx` for the confirmation dialog
   - `AppHeader.tsx` and `HeroSection.tsx` for top-of-page framing
   - `ErrorBanner.tsx` for inline error messaging
2. Introduce lightweight hooks/utilities
   - `hooks/useToast.ts` managing toast state + auto-dismiss timer
   - `hooks/usePdfExport.ts` managing PDF export state with auto-reset
   - `utils/summary.ts` housing `composeSummaryDocument`, key takeaway/hashtag extraction, and size formatting helpers
3. Centralize shared types in `types/summary.ts` for import by `App` + new components
4. Update `App.tsx`
   - Replace inline JSX with new components, wiring existing state/handlers via props
   - Adopt new hooks for toast/PDF state to remove manual timeout bookkeeping
   - Memoize heavy subtrees (summary viewer/history panel) to avoid unnecessary re-renders
5. Keep all effects/business logic inside `App` and validate parity with lint/tests/build + manual QA checklist

## Acceptance criteria
- No visual or behavioral regressions
- `npm run lint`, `npm test -- --runInBand`, and `npm run build` succeed
- Manual QA checklist passes: URL submit pipeline stages, downloads (MD/PDF), copy-to-clipboard, transcript toggle, history refresh/select/delete, toast auto-dismiss
- `src/App.tsx` line count reduced by ≥50% compared to baseline (~1.4k → ≤700 lines)

## Risks
- Missed prop wiring could break actions (download, regenerate, delete)
- Memoization needs stable callbacks; ensure existing `useCallback` hooks cover new props
- New files must retain existing CSS class names to avoid style regressions

## References
- UI Decomposition (Low-Risk Refactor) template
- WatchLater Architecture Cheat Sheet (§ App.tsx + queue logic overview)
