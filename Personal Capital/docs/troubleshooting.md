# Troubleshooting & FAQ

> Diagnose issues with Apps Script, CSV imports, digest scripts, and Google Sheets integration.

## Table of Contents
- [Common Issues](#common-issues)
- [Import Errors](#import-errors)
- [Categorization Issues](#categorization-issues)
- [Insights Sidebar](#insights-sidebar)
- [Python Script Failures](#python-script-failures)
- [Quota & Performance](#quota--performance)
- [Platform Notes](#platform-notes)

## Common Issues
| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| `No files selected for import` | Dialog submitted without files | Reselect CSVs; confirm file type is `.csv` |
| `Exception: Sheet not found` | Missing staging or ledger sheet | Run `ensureSheets()` or reload the workbook |
| Imports stop mid-file | Apps Script execution timeout | Split large CSVs or create time-driven batch imports |

## Import Errors
- **Mismatch columns**: Ensure bank exports use default column ordering; custom exports may require parser tweaks.
- **CSV encoding**: Use UTF-8. Re-export from bank portal if columns contain unusual characters.
- **Duplicate rows**: Implement deduping logic before import or rely on ledger validation rules in Sheets.

## Categorization Issues
- **Rule not applied**: Check regex spelling, priority order, and amount bounds.
- **Low confidence**: Enhance rules with amount ranges or additional pattern anchors.
- **Cache stale**: Delete document property `CATEGORY_RULES_CACHE` or wait one hour for automatic refresh.

## Insights Sidebar
- **Charts not loading**: Confirm `Transactions` sheet contains data within the selected date range.
- **Script error**: Open Apps Script execution logs to identify failing functions; missing libraries or invalid data may block rendering.

## Python Script Failures
| Error | Cause | Fix |
| --- | --- | --- |
| `FileNotFoundError` | Input CSV missing | Verify file paths in `docs/` or pass CLI arg |
| `ImportError: pandas` | Dependencies missing | Install via `pip install pandas numpy scipy` |
| `ValueError: time data ...` | Unexpected date format | Update parsing logic or pre-clean CSV |

## Quota & Performance
- Time-driven triggers limited to 6 minutes per execution (free accounts). Batch large imports or upgrade to Workspace.
- Use caching and batch updates to reduce calls to `SpreadsheetApp`.
- Avoid attaching triggers to `onEdit`; prefer manual or scheduled runs to limit load.

## Platform Notes
- Google Sheets mobile UI may not display custom menus; run imports on desktop browsers.
- When collaborating, instruct users to authorize the script on first use; failure to do so results in permission prompts.
- For corporate environments, coordinate with IT to allow CLASP OAuth flows through proxies.
