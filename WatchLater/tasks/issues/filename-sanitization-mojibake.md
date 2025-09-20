# Issue: Filename sanitization produces garbled characters (mojibake)

- **Summary**: Saved files sometimes contain mojibake such as `ΓÇÖ` where curly quotes or em dashes exist in the source title.
- **Labels**: bug, file-io

## Why it happens
We currently strip forbidden filesystem characters but do not normalize Unicode or convert smart punctuation to ASCII before applying the regex.

## Steps to reproduce
1. Paste a YouTube URL whose title includes curly quotes or em dashes.
2. Run the summarize flow and save transcript/summary.
3. Inspect filenames written to `exports/`.

**Expected**: Filenames should include readable ASCII quotes/dashes (e.g., `...Branson's Private Island...`).

**Actual**: Filenames include mojibake such as `ΓÇÖ` in place of punctuation.

## Fix sketch
Normalize titles with NFKD, drop diacritics, map smart quotes/dashes to ASCII, then apply the existing safe-character regex. Reuse the same logic for both client and server generation paths.

## Acceptance Criteria
- Filenames generated on both client and server use ASCII punctuation equivalents instead of mojibake.
- Unit tests cover curly quotes, em/en dashes, and accented characters.
