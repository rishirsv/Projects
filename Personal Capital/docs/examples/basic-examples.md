# Basic Examples

> Common workflows for getting started with the Personal Capital Apps Script.

## Table of Contents
- [Import a Single AMEX CSV](#import-a-single-amex-csv)
- [Bulk Import Multiple Banks](#bulk-import-multiple-banks)
- [Run Auto-Categorization](#run-auto-categorization)
- [Move Transactions to Ledger](#move-transactions-to-ledger)
- [Generate Net Worth Digest](#generate-net-worth-digest)

## Import a Single AMEX CSV
1. Open the Google Sheet bound to the script.
2. Choose `Personal Capital` → `Import CSV(s)…`.
3. Select the AMEX CSV. After processing, check `STG_Transactions` for new rows with `Source` set to `AMEX`.

## Bulk Import Multiple Banks
```javascript
function nightlyImport() {
  const folder = DriveApp.getFolderById('FOLDER_ID');
  const files = [];
  const iter = folder.getFilesByType('text/csv');
  while (iter.hasNext()) {
    files.push(iter.next());
  }
  importCsvFiles(files);
}
```
Schedule `nightlyImport()` with a time-driven trigger to ingest CSVs dropped into a Drive folder.

## Run Auto-Categorization
```javascript
function categorizeStaging() {
  ensureSheets();
  runAutoCategorization();
}
```
Run manually or via trigger after imports. Review `RuleID` and `Confidence` columns to confirm results.

## Move Transactions to Ledger
```javascript
importToTransactions({
  from: '2024-01-01',
  to: '2024-01-31'
});
```
Moves January transactions out of staging. Toast confirms rows moved.

## Generate Net Worth Digest
```bash
cd "Personal Capital"
python3 process_net_worth.py
```
Outputs `PF_NetWorth_Digest.csv` with monthly totals, crypto allocation, and drawdown metrics.
