# API & Integration Guide

> Reference for Apps Script functions, HTML dialogs, and Python utilities used by the Personal Capital toolkit.

## Table of Contents
- [Apps Script Functions](#apps-script-functions)
- [Dialogs & UI Components](#dialogs--ui-components)
- [Python Utilities](#python-utilities)
- [Custom Functions & Extensions](#custom-functions--extensions)
- [Error Handling](#error-handling)
- [Integration Patterns](#integration-patterns)

## Apps Script Functions
| Function | Location | Description |
| --- | --- | --- |
| `onOpen(e)` | `Code.js` | Builds the custom menu and ensures required sheets exist. |
| `ensureSheets()` | `Code.js` | Verifies or creates `STG_Transactions`, `Transactions`, `SYS_ImportLog`, `SYS_CatRules`. |
| `importCsvFiles(files)` | `Code.js` | Entry point invoked by the HTML dialog; auto-detects bank format and routes to specific parsers. |
| `importAmexCSV(files)` | `Code.js` | Parses AMEX CSVs, normalizes amounts, appends to staging. |
| `importCIBCCSV(files)` | `Code.js` | Parses CIBC CSVs with debit/credit separation. |
| `importSimpliiCSV(files)` | `Code.js` | Parses Simplii CSVs similar to CIBC. |
| `importToTransactions({from, to})` | `Code.js` | Moves rows from staging to ledger with optional date filters. |
| `logImportStats(bank, rowsRead, rowsKept, rowsSkipped)` | `Code.js` | Appends import metrics to `SYS_ImportLog`. |
| `loadCategoryRules()` | `Code.js` | Reads, compiles, and caches regex rules for categorization. |
| `matchTransactionToRules(vendor, amount, source, rules)` | `Code.js` | Determines best-fit category and confidence. |
| `runAutoCategorization()` | `Code.js` | Batch process staging rows, applying rules and updating metadata. |
| `autoCategorizeTransaction(vendor, amount, source)` | `Code.js` | Returns category, rule ID, and confidence for a single transaction. |
| `benchmarkRulePerformance()` | `Code.js` | Benchmarks categorization throughput; useful for regression tests. |

> ✅ Wrap Apps Script functions with `google.script.run.withSuccessHandler` in dialogs for asynchronous execution and error reporting.

## Dialogs & UI Components
| File | Purpose | Key Methods |
| --- | --- | --- |
| `ImportDialog.html` | Drag-and-drop uploader for CSV files | Reads files with `FileReader`, calls `importCsvFiles`, displays status toasts |
| `ImportToLedgerDialog.html` | Date-range picker for staging → ledger imports | Submits `from`/`to` ISO strings to `importToTransactions` |
| `ReviewSidebar.html` | (Roadmap) Sidebar for reviewing uncategorized transactions | Offers category dropdowns and rule creation controls |
| `SpendingInsightsDialog.html` | Period selection modal for insights | Launches sidebar analytics |
| `SpendingInsightsSidebar.html` | Visualization dashboard | Uses Google Charts to render summaries and tables |

## Python Utilities
| Script | Description | Inputs | Outputs |
| --- | --- | --- | --- |
| `process_net_worth.py` | Aggregates Personal Capital net worth exports into digest format with rolling metrics and milestone flags. | `docs/Net Worth.csv` | `PF_NetWorth_Digest.csv` (with header comment) |
| `process_ibkr_digests.py` | Parses IBKR PortfolioAnalyst exports into performance, allocation, position, and cash-flow digests; computes alpha, beta, Sharpe, Sortino. | PortfolioAnalyst CSV | `PF_IBKR_Performance_Digest.csv`, `PF_IBKR_Allocation_Digest.csv`, `PF_IBKR_Position_Digest.csv`, `PF_Cashflow_Digest.csv` |

Each script can be extended with CLI flags (e.g., `--input`, `--output`, `--start-date`). Use `argparse` to make them batch-friendly if integrating with CI/CD.

## Custom Functions & Extensions
- Add `@OnlyCurrentDoc` annotations to restrict Apps Script permissions when publishing add-ons.
- Create custom spreadsheet functions (e.g., `=PC_GET_CATEGORY("Vendor")`) by exposing lightweight wrappers that read from `SYS_CatRules` or digests.
- Use Google Workspace Add-on framework to package the UI for distribution beyond personal use.

## Error Handling
- Apps Script errors bubble up to dialog failure handlers; append `.withFailureHandler(onImportFailure)` to provide user-friendly messages.
- Python scripts catch exceptions, print stack traces, and return exit code `1` when processing fails.
- Extend `logImportStats` and `pcToast` wrappers to notify Slack or email on critical failures.

## Integration Patterns
- **Scheduled Imports**: Combine Google Drive event triggers with `importCsvFiles` to ingest new statements automatically.
- **Data Warehouse**: Export `Transactions` to BigQuery via Apps Script or `gspread` for long-term storage and BI reporting.
- **Financial Coaching**: Package the spreadsheet as a template; share the documentation link so clients follow onboarding steps.
- **Automation**: Use Make/Zapier to upload bank CSVs into a Drive folder, then trigger Apps Script via time-based triggers.
