# Issue: Empty transcript/summary files can be saved

- **Summary**: Backend and client allow writing zero-byte files when upstream returns empty content.
- **Labels**: bug, file-io, ux

## Steps to reproduce
1. Choose a YouTube video without an available transcript.
2. Run the summarize flow until the save steps.
3. Inspect `exports/` directories.

**Expected**: Saving is blocked with a clear "No transcript available" message.

**Actual**: Empty files (.txt/.md) are persisted and appear in history.

## Fix sketch
Validate non-empty content on the server before writing files and have the client block save actions if the payload is empty.

## Acceptance Criteria
- The server rejects save requests when transcript or summary content is empty.
- UI displays “No transcript available” (or similar) instead of saving empty files.
- Tests cover the rejection path.
