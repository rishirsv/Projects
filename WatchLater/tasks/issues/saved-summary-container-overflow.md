# Issue: Saved summary queue container overflows summary panel

- **Summary**: The Saved Summaries panel renders its queue cards wider than the containing panel, so the dashed outlines and action buttons spill past the intended bounds of the history column. The mismatch is especially noticeable when several batch items are present (see attached screenshot in report).
- **Labels**: bug, ui, layout

## Visual evidence

- **Full dashboard context**: ![Full layout showing overflow](../media/saved-summary-overflow-full.png)
- **History panel close-up**: ![History panel crop highlighting overflow](../media/saved-summary-overflow-panel.png)

Notes from the new Playwright capture:
- Dashed outlines on queue cards still render beyond the visible right edge of the aside column.
- `Retry` / `Dismiss` pill buttons hug the border with effectively `0px` padding, confirming the overflow occurs even when the viewport is 320 px wide (default large-screen aside width).
- Cards with dashed borders visually “bleed” into the gutter, while completed history entries (solid borders) render correctly—isolating the regression to `.history-item.queue` variants.

## Steps to reproduce
1. Launch the WatchLater web UI (`npm run start`).
2. Queue several videos so that the Saved Summaries history panel shows both processing and failed batch entries.
3. View the history panel at desktop widths (≥1024px, where the aside column is ~320px).

**Expected**: Each saved summary / batch queue card fits cleanly inside the history panel, aligning with the video summary column without horizontal overflow.

**Actual**: Queue cards extend beyond the panel’s visual container, causing the dashed borders to clip and the action buttons (`Retry`, `Dismiss`, etc.) to hug the right edge with no padding (see screenshot).

## Suspected cause
- `.history-item` defines `padding-right: calc(var(--space-4) + 40px)` to make room for the delete icon. When `.history-item.queue` overrides the layout to `display: flex` (see `src/App.css:873-979`), it keeps that padding but hides the delete icon, so the dashed border is drawn against the full width while the content still flows past the aside.
- Queue cards rely on `justify-content: space-between` with no `flex-basis` limits. The actions cluster can grow beyond the parent width, and without `grid-template-columns` or explicit min/max widths, the dashed outline and pill buttons extend past `width: 100%`.
- The aside column is capped at `grid-template-columns: 1fr 320px` (`src/App.css:1267-1270`), so any positive horizontal overflow shows immediately as clipped borders.
- Playwright screenshot confirms the issue happens even when local state is seeded via `watchlater-batch-import-queue`, so this is a pure CSS/layout bug rather than runtime state drift.

## Remediation plan

1. **Normalize queue card container**
   - Update `.history-item.queue` (`src/App.css:937-979`) to use `display: grid` with `grid-template-columns: minmax(0, 1fr) auto`, drop the inherited `padding-right`, and ensure `box-sizing: border-box` is retained.
   - Tweak `gap`/`padding` so dashed outlines respect the aside width while maintaining breathing room around action buttons.

2. **Constrain action cluster width**
   - Give `.history-item.queue .history-item-actions` (`src/App.css:972-978`) a `justify-self: end` and `max-width` guard, relying on `flex-wrap` or `column-gap` to stack buttons when space is tight.
   - For failed states, ensure the two-button cluster stacks vertically below ~320 px; use media query or `flex-wrap` + `width: min-content` to avoid forcing horizontal overflow.

3. **Isolate padding for delete icon**
   - Move delete-icon padding into a modifier (`.history-item.has-delete` or similar) so queue variants can opt-out cleanly. Alternatively, reset the padding inside the queue block.

4. **Add regression coverage**
   - Extend the lightweight Playwright script under `tasks/issues/media/` into an automated snapshot (or Jest + Playwright test under `tests/`) that seeds `localStorage` with queue items and verifies `element.scrollWidth === element.clientWidth`.
   - Capture refreshed screenshots after CSS changes to update the issue doc with “after” references.

5. **Manual verification checklist**
   - Desktop (≥1024 px) history panel with mixed processing/failed entries.
   - Narrow view (≤768 px) to confirm stacked layout still fits once the aside collapses below 320 px.
   - Hover states for non-queue history cards to ensure delete button spacing remains correct.

## Acceptance Criteria
- Saved summary and queue cards always respect the history panel width across breakpoints.
- Action buttons retain consistent padding from the right edge; no clipping or overflow.
- Visual regression (manual or automated) documented so future style changes keep the panel aligned with the main summary container.
