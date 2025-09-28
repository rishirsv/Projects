# Tasks: WatchLater UI Decomposition (Low‑Risk Refactor)

This task list mirrors the PRD in `prompts/create-prd.md` and uses kebab-case filenames per repo conventions.

## Pre‑flight
- [ ] Ensure clean working tree; create a feature branch.
- [ ] Install deps once: `npm ci` (from `WatchLater/`).
- [ ] Run baseline checks: `npm run lint`, `npm test -- --runInBand`, `npm run build`.

## Phase A — Core component extraction (no logic moves)
1) Signal glyph
- [ ] Extract header SVG into `src/components/signal-glyph.tsx` (export `SignalGlyph`).
- [ ] Replace inline usage in `src/App.tsx`; keep props `{ animated: boolean }`.

2) Toast host
- [ ] Extract toast markup into `src/components/toast.tsx` (export `Toast`).
- [ ] Props: `{ toast: ToastState | null }`.
- [ ] Replace inline toast rendering in `src/App.tsx`.

3) Progress pipeline
- [ ] Extract stages grid into `src/components/progress-pipeline.tsx`.
- [ ] Props: `{ stages: Stage[]; currentStage: number; status: 'idle'|'processing'|'complete'|'error' }`.
- [ ] Render identical markup/classes; no logic changes.

4) Summary actions
- [ ] Extract actions header row into `src/components/summary-actions.tsx`.
- [ ] Include `ModelSelector` inside this component.
- [ ] Props: `{ summary?: SummaryData|null; pdfState: PdfExportState; onDownloadMd():void; onDownloadPdf():void; onCopy():void; onRegenerate():void; onOpenFolder():void }`.
- [ ] Wire existing handlers from `App`.

5) Summary viewer
- [ ] Extract markdown + details into `src/components/summary-viewer.tsx`.
- [ ] Props: `{ summary: SummaryData|null; showTranscript: boolean; onToggleTranscript(open:boolean):void }`.
- [ ] Use `React.memo` to reduce re‑renders.

## Phase B — Right column & modals
6) History panel
- [ ] Extract right column into `src/components/history-panel.tsx`.
- [ ] Props (saved list): `{ items: SavedSummary[]; loading: boolean; onRefresh():void; onSelect(item: SavedSummary):void; onDelete(item: SavedSummary, title: string):void }`.
- [ ] Props (queue): `{ queueItems: BatchQueueItem[]; stats: any; isStopRequested: boolean; activeItem: BatchQueueItem|null; onStopActive():void; onStopAll():void; onResume():void; onRecover():void; onRetry(item: BatchQueueItem):void; onDismiss(item: BatchQueueItem):void }`.
- [ ] Optional: separate `src/components/queue-item.tsx` for a single queue row.

7) Delete modal
- [ ] Extract confirmation dialog into `src/components/delete-modal.tsx`.
- [ ] Props: `{ state: DeleteModalState; error?: string; onCancel():void; onConfirm():void; onChangeInput(v:string):void; onToggleIncludeTranscripts?(b:boolean):void; onToggleDeleteAllVersions?(b:boolean):void }`.
- [ ] Preserve ARIA/dialog semantics and focus behavior.

## Phase C — Optional UI hooks + utils/types
8) Toast hook
- [ ] Create `src/hooks/use-toast.ts` that manages `{ toast, showToast }` + 4s auto‑dismiss.
- [ ] Replace local toast state/effects in `App` with the hook.

9) PDF export hook
- [ ] Create `src/hooks/use-pdf-export.ts` that manages `{ pdfState, setPdfState }` + success auto‑reset.
- [ ] Replace local pdf state/effects in `App` with the hook.

10) Utilities & types
- [ ] Move `composeSummaryDocument`, `extractKeyTakeaways`, `extractHashtags`, `formatKilobytes` to `src/utils/summary.ts`.
- [ ] Add `src/types/summary.ts` for `SummaryData`, `SavedSummary`, `PdfExportState`, `DeleteModalState`, `ToastState`, `Stage`.
- [ ] Update imports in new components and `App`.

## Validation — Automated
- [ ] Run `npm run lint`.
- [ ] Run `npm test -- --runInBand`.
- [ ] Run `npm run build`.

## Validation — Manual QA
- [ ] Paste URL → stages progress 1→4; summary renders; no console errors.
- [ ] Cancel mid‑processing resets status/stage.
- [ ] Regenerate summary works; saved file updates.
- [ ] Download Markdown/PDF; PDF shows success feedback state.
- [ ] Copy to clipboard works.
- [ ] Transcript toggle opens/closes; content shows only when open.
- [ ] Batch modal focus returns to trigger on close.
- [ ] Queue controls: stop current, stop all (confirm), resume, retry stalled.
- [ ] History refresh; selecting item loads summary; delete single and clear all flows.
- [ ] Toast shows for 4s and hides.
- [ ] Check roles/labels (`role="dialog"`, `aria-live="polite"`) remain present.

## Rollout & Backout
- [ ] Phase A → PR 1: `refactor(ui): extract core components`.
- [ ] Phase B → PR 2: `refactor(ui): extract history panel + delete modal`.
- [ ] Phase C → PR 3 (optional): `refactor(ui): add UI hooks and utils`.
- [ ] Backout by reverting the last PR only.

## Done When
- [ ] UX is unchanged; screenshots look identical.
- [ ] `src/App.tsx` line count reduced by >50%.
- [ ] All checks pass; no TypeScript errors.
- [ ] Manual QA checklist complete.
