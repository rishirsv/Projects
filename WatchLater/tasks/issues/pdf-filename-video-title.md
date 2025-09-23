# PDF filename should use video title instead of video ID

## Summary
When users download PDF versions of summaries, the filename currently uses the video ID with "-summary.pdf" appended. This results in cryptic filenames like `gO0bvT_smdM-summary.pdf`. We should use the actual video title instead, resulting in more readable filenames like "How to Change Your Life - Summary.pdf".

## Current implementation
- PDF downloads are handled by `downloadSummaryPdf(videoId)` in `src/api.ts` (line 801)
- Current filename generation: `const filename = suggestedName || \`${videoId}-summary.pdf\`;` (line 819)
- Function only receives `videoId` parameter, no access to video title
- Call site in `App.tsx` (line 556): `const filename = await downloadSummaryPdf(summary.videoId);`
- `SummaryData` type already includes `title` property (line 47-48 in App.tsx)

## Problem analysis
1. **Poor user experience**: Video ID-based filenames are not descriptive or searchable
2. **Existing infrastructure**: `generateSummaryFilename` and `generateTranscriptFilename` functions in `src/utils.ts` already handle title-based naming
3. **Missing title access**: `downloadSummaryPdf` function doesn't have access to video title despite it being available in the calling context
4. **Inconsistency**: Other file exports (MD, TXT) already use title-based naming

## Reproduction notes
1. Generate a summary for any YouTube video
2. Click the PDF download button
3. Observe filename uses video ID instead of readable title

## Fix plan

### 1. Update function signature and implementation
- Modify `downloadSummaryPdf` to accept optional `title` parameter: `downloadSummaryPdf(videoId: string, title?: string, config?: RequestConfig)`
- Update filename generation to use title when available: `${title || videoId} - Summary.pdf`
- Use existing `sanitizeTitle` utility from `src/utils.ts` for safe filename generation

### 2. Update call sites
- Update `App.tsx` line 556 to pass summary title: `downloadSummaryPdf(summary.videoId, summary.title)`
- Add proper error handling for missing title scenarios
- Ensure backward compatibility for any other call sites

### 3. Enhance filename sanitization
- Import `sanitizeTitle` from `src/utils.ts`
- Apply sanitization to title before using in filename
- Handle edge cases: empty titles, special characters, length limits

### 4. Add tests
- Add unit tests for filename generation logic
- Test with various title formats (special characters, emojis, very long titles)
- Ensure fallback to videoId works when title is unavailable

### 5. Update server-side filename handling
- Check if server endpoint `/api/summary/${videoId}/pdf` needs title information
- Update Content-Disposition header generation if needed
- Ensure backward compatibility

## Acceptance criteria
- PDF filenames use video title when available: `"Video Title - Summary.pdf"`
- Fallback to video ID when title unavailable: `"videoId - Summary.pdf"`
- Filenames are properly sanitized (no invalid filesystem characters)
- All existing functionality preserved
- New behavior works for both new and saved summaries

## Risks
- **Breaking changes**: Function signature change requires updating all call sites
- **Server compatibility**: Backend may need updates to handle title-based filenames
- **Edge cases**: Very long titles may exceed filesystem limits
- **International characters**: Unicode handling in filenames across different OS

## Next steps (no code changes yet)
1. Review all `downloadSummaryPdf` call sites for compatibility
2. Design title sanitization approach using existing utilities
3. Consider server-side filename header generation
4. Plan integration testing with various video title formats
