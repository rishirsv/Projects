# Issue: Saved summary queue container overflows summary panel

- **Summary**: The Saved Summaries panel renders its queue cards wider than the containing panel, so the dashed outlines and action buttons spill past the intended bounds of the history column. The mismatch is especially noticeable when several batch items are present (see attached screenshot in report).
- **Labels**: bug, ui, layout

## Steps to reproduce
1. Launch the WatchLater web UI (`npm run start`).
2. Queue several videos so that the Saved Summaries history panel shows both processing and failed batch entries.
3. View the history panel at desktop widths (≥1024px, where the aside column is ~320px).

**Expected**: Each saved summary / batch queue card fits cleanly inside the history panel, aligning with the video summary column without horizontal overflow.

**Actual**: Queue cards extend beyond the panel’s visual container, causing the dashed borders to clip and the action buttons (`Retry`, `Dismiss`, etc.) to hug the right edge with no padding (see screenshot).

## Suspected cause
- `.history-item` reserves right-padding for the delete icon even in the `.queue` variant, which switches to `display: flex`. The combination shrinks the usable width while still drawing full-width dashed borders.
- The queue variant lacks an explicit width constraint/box sizing, so flex content can stretch beyond the parent panel while the outline stays flush to the outside.

## Fix sketch
- Adjust `.history-item.queue` styles to inherit full `box-sizing: border-box` and drop the extra right padding reserved for delete icons.
- Ensure queue/action sections wrap cleanly by adding `flex-wrap` with consistent inner spacing.
- Add a regression story or visual test that loads multiple queue states and asserts no horizontal overflow (e.g., via Playwright screenshot, Percy, or manually captured reference).

## Acceptance Criteria
- Saved summary and queue cards always respect the history panel width across breakpoints.
- Action buttons retain consistent padding from the right edge; no clipping or overflow.
- Visual regression (manual or automated) documented so future style changes keep the panel aligned with the main summary container.
