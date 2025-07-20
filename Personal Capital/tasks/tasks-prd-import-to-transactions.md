## Relevant Files

- `Personal Capital/Code.js` - Contains Apps Script logic; will add the `importToTransactions` function and supporting helpers.
- `Personal Capital/ImportToLedgerDialog.html` - Front-end dialog that supplies date range and triggers the import.

### Notes

- Functions live in Google Apps Script environment; unit tests are typically manual or via GAS testing frameworks.
- Toasts and alerts should inform the user of success or errors.

## Tasks

- [x] 1.0 Define Sheet Constants and Utility Functions
  - [x] 1.1 Add sheet-name constants (`SH_STG`, `SH_TX`) near top of `Code.js`.
  - [x] 1.2 Implement helper `num()` (parse numeric) if needed (skipped – not required for this scope).
  - [x] 1.3 Implement helper `toast(msg, title, secs)` wrapper around `SpreadsheetApp.getActive().toast`.

- [x] 2.0 Implement Core `importToTransactions` Function Logic
  - [x] 2.1 Create the `importToTransactions({from, to})` function in `Code.js`.
  - [x] 2.2 Obtain active spreadsheet and get `Staging` / `Transactions` sheets.
  - [x] 2.3 Validate sheets exist; show alert and abort if missing.

- [x] 3.0 Add Date Range Filtering for Transactions
  - [x] 3.1 Parse incoming `from`/`to` values to `Date` objects (handle blanks).
  - [x] 3.2 Grab all data rows from `Staging` sheet (skip header).
  - [x] 3.3 Filter rows whose date (col A) lies within the specified range.

- [x] 4.0 Move Filtered Rows to Transactions Sheet
  - [x] 4.1 Calculate destination start row (last row + 1) in `Transactions`.
  - [x] 4.2 Append filtered rows to `Transactions` via `setValues`.
  - [x] 4.3 Ensure date column is stored as date object / correct format.

- [x] 5.0 Delete Moved Rows from Staging Sheet
  - [x] 5.1 Collect original row indices of moved rows.
  - [x] 5.2 Delete rows from bottom-up to keep indices stable.

- [x] 6.0 Add User Feedback and Error Handling
  - [x] 6.1 Show toast indicating number of rows moved.
  - [x] 6.2 If no rows matched, alert the user.
  - [x] 6.3 Wrap main logic in `try/catch` and alert on exception; log via `Logger`. 