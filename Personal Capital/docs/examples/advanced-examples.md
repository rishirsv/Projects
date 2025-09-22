# Advanced Examples

> End-to-end workflows and automation patterns for power users.

## Table of Contents
- [Drive Watcher for CSV Imports](#drive-watcher-for-csv-imports)
- [Advanced Rule Creation](#advanced-rule-creation)
- [Analytics Integration with Looker Studio](#analytics-integration-with-looker-studio)
- [Data Validation Pipeline](#data-validation-pipeline)
- [Backup Strategy](#backup-strategy)
- [Python Automation](#python-automation)

## Drive Watcher for CSV Imports
Use an Apps Script trigger to watch a Drive folder and auto-import new statements.
```javascript
function onCsvUploaded(e) {
  const file = DriveApp.getFileById(e.id);
  importCsvFiles([file]);
  file.setTrashed(true); // optional cleanup
}
```
Configure an installable trigger in Apps Script for the target folder.

## Advanced Rule Creation
Add rules with amount bounds and priorities to differentiate similar vendors:
```
Pattern,Category,Priority,MinAmt,MaxAmt,Type,Notes
"^UBER",Transport,10,-100,0,expense,Ride sharing
"^UBER",Income,20,0,500,income,Driver payouts
```
Lower priority number ensures expenses match before income payouts.

## Analytics Integration with Looker Studio
1. Export `Transactions` to a CSV using `File → Download` or the Sheets API.
2. Connect Looker Studio to the CSV or live Sheet.
3. Build dashboards for category trends, month-over-month spending, and savings rates.
4. Schedule Python digest scripts to feed net-worth and portfolio data into the same dashboard.

## Data Validation Pipeline
```javascript
function validateStagingRows() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SH_STG);
  const data = sheet.getDataRange().getValues().slice(1);
  const invalid = data.filter(row => !(row[0] instanceof Date) || isNaN(row[2]));
  if (invalid.length) {
    throw new Error(`Found ${invalid.length} invalid rows; fix before importing.`);
  }
}
```
Call `validateStagingRows()` before `importToTransactions` to enforce data hygiene.

## Backup Strategy
- Use `DriveApp.getFileById(SpreadsheetApp.getActive().getId()).makeCopy()` to snapshot the workbook weekly.
- Store digest outputs (`PF_*_Digest.csv`) in versioned Drive folders or S3 buckets.
- Export Apps Script versions with `clasp versions` and annotate release notes in `docs/changelog.md`.

## Python Automation
Schedule digests via cron:
```cron
0 6 * * 1 cd /opt/personal-capital && /usr/bin/python3 process_ibkr_digests.py >> logs/digest.log 2>&1
```
Combine outputs with Google Drive API to upload fresh digests automatically.
