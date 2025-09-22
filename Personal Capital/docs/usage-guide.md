# Usage Guide

> Walkthrough of daily tasks including CSV import, categorization, ledger updates, and analytics.

## Table of Contents
- [User Interface Overview](#user-interface-overview)
- [Importing Transactions](#importing-transactions)
- [Categorization Workflow](#categorization-workflow)
- [Moving Data to the Ledger](#moving-data-to-the-ledger)
- [Rule Management](#rule-management)
- [Analytics & Insights](#analytics--insights)
- [Batch Operations](#batch-operations)
- [Python Digest Workflow](#python-digest-workflow)
- [Deployment & Operations](#deployment--operations)
- [Support & Community](#support--community)

## User Interface Overview
- **Custom Menu**: `Personal Capital` menu appears on sheet open with actions for importing CSVs, running auto-categorization, and moving staging data to the ledger.
- **Import Dialog** (`ImportDialog.html`): Drag-and-drop CSV uploader with progress feedback.
- **Staging Sheet**: `STG_Transactions` collects raw imports including rule metadata and confidence scores.
- **Review Sidebar** (future): Allows quick categorization of uncategorized items (see roadmap in `docs/changelog.md`).
- **Spending Insights Sidebar**: Visualizes key metrics (YTD spending, category breakdowns) using Google Charts.

## Importing Transactions
1. Open the target Google Sheet and click `Personal Capital` → `Import CSV(s)…`.
2. Drag and drop AMEX, CIBC, or Simplii CSV files into the dialog.
3. The script auto-detects bank formats and routes data to the correct parser (`importAmexCSV`, `importCIBCCSV`, `importSimpliiCSV`).
4. Each parser normalizes dates, vendors, and amounts, ensuring debits are negative and credits positive.
5. Rows with missing required fields are skipped. Success/failure toasts display import stats; detailed counts are stored in `SYS_ImportLog` via `logImportStats()`.

> ✅ You can import multiple files at once. The dialog aggregates progress, ensuring partial failures do not stop the batch.

## Categorization Workflow
- Imported transactions remain in `STG_Transactions` until categorized.
- `runAutoCategorization()` loads rules from `SYS_CatRules`, caches them in document properties, and applies matches in batches of 100 rows.
- Matching logic considers regex patterns, optional amount ranges, rule priority, and transaction type.
- Auto-categorized rows receive `RuleID` and `Confidence` annotations; unmatched rows remain blank for manual review.
- Use manual edits or future sidebar tooling to adjust categories before final import.

## Moving Data to the Ledger
1. Choose `Personal Capital` → `Import Staging → Transactions…`.
2. Select optional date filters; leaving fields blank moves all staged rows.
3. `importToTransactions()` copies matching rows into `Transactions`, then deletes them from staging (bottom-up to preserve indices).
4. A toast confirms the number of rows moved. The audit log remains intact in `SYS_ImportLog`.

## Rule Management
- Rules live in `SYS_CatRules` with columns:
  | Column | Description |
  | --- | --- |
  | `Pattern` | Case-insensitive regex applied to vendor names |
  | `Category` | Target ledger category |
  | `Priority` | Lower numbers run first (1 = highest) |
  | `MinAmt`/`MaxAmt` | Optional numeric bounds to avoid false positives |
  | `Type` | Optional tag (e.g., `income`, `expense`) |
  | `Notes` | Free-form context |
- Use the auto-categorize sidebar (planned) or manual edits to create new rules.
- Rebuild cache using `runAutoCategorization()` whenever rules change; the script caches results for one hour.

## Analytics & Insights
- Launch the spending insights dialog to select a reporting range (Last Month, YTD, Trailing 12 Months).
- The sidebar aggregates totals, category splits, and momentum metrics using data from `Transactions`.
- Python digests (`PF_IBKR_*`, `PF_NetWorth_*`) complement in-sheet analytics by generating time series and risk metrics for external dashboards.

## Batch Operations
- Use the `importCsvFiles(files)` Apps Script function to programmatically ingest Drive files (e.g., triggered from Google Drive events).
- The script is batch-safe: it filters empty selections, handles multiple banks, and logs aggregate success/error counts.
- For large imports consider chunking files or introducing short `Utilities.sleep()` intervals to stay within Apps Script quotas.

## Python Digest Workflow
- `process_net_worth.py`: Converts Personal Capital net worth exports into monthly timelines, rolling stats, and milestone flags.
- `process_ibkr_digests.py`: Parses Interactive Brokers PortfolioAnalyst CSVs into four digest files (performance, allocation, positions, cash flow) with advanced metrics like alpha, beta, Sharpe, and Sortino ratios.
- Schedule scripts via cron or GitHub Actions to refresh digests, then upload outputs to Sheets or BI tools.

## Deployment & Operations
- **Versioning**: Use Apps Script deployments to stage changes; maintain distinct deployment IDs for production vs. testing sheets.
- **Backups**: Export bound script versions regularly (`clasp pull`) and commit to version control.
- **Monitoring**: Add simple logging statements to key functions (`Logger.log`). Consider email notifications via `MailApp` for critical failures.
- **Updates**: Document manual verification steps in `docs/` whenever scripts change, aligning with repository guidelines.

## Support & Community
- Check the [Troubleshooting Guide](./troubleshooting.md) for quota errors, CSV mismatches, and Apps Script limitations.
- Share enhancements via pull requests following the [Contributing Guide](./contributing.md).
- For financial planning advice, reference `docs/PF Custom Instructions.md` to understand domain expectations and data sources.
