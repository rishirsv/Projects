## Relevant Files

- `Personal Capital/Code.js` - Main server-side logic; will add rule engine, auto-categorization functions, and rule management.
- `Personal Capital/tasks/prd-autocategorize-transactions.md` - Product requirements document for this feature.

### Notes

- Rule storage will use existing `CategoryRules` sheet with columns: Pattern, Category, Priority, MinAmt, MaxAmt, Type.
- Auto-categorization integrates into existing CSV import pipeline without breaking current functionality.
- Confidence scoring based on rule priority and match quality to help users identify review candidates.
- Performance target: ≤2s for 2000 rows, ≥90% accuracy after rule learning.

## Tasks

- [x] 1.0 Create Rule Storage and Management System
  - [x] 1.1 Implement `loadCategoryRules()` function to read rules from CategoryRules sheet and cache in PropertiesService.getDocumentProperties().
  - [x] 1.2 Create `saveCategoryRule(pattern, category, priority, minAmt, maxAmt, type)` function.

- [x] 2.0 Implement Rule Engine and Matching Logic
  - [x] 2.1 Create `matchTransactionToRules(vendor, amount, transactionType, rules)` function.
  - [x] 2.2 Implement regex pattern matching with case-insensitive vendor name matching (pre-compile regex for performance).
  - [x] 2.3 Add amount range filtering (MinAmt/MaxAmt) and transaction type filtering (Debit/Credit/Any).
  - [x] 2.4 Implement priority-based rule selection (lowest priority wins when multiple rules match).
  - [x] 2.5 Add performance optimization for rule evaluation across large datasets.
  - [x] 2.6 Return empty string '' for category when no rules match (Uncategorized fallback).
  - [x] 2.7 Add performance benchmark using Utilities.getCpuTime() to verify ≤2s for 2000 rows requirement.

- [ ] 3.0 Integrate Auto-Categorization as Manual Menu Option
  - [ ] 3.1 Add "Auto-Categorize Staging Transactions" menu item to Personal Capital menu.
  - [ ] 3.2 Implement `runAutoCategorization()` function to process all transactions in staging sheet.
  - [ ] 3.3 Update staging sheet schema to include `RuleID` and `Confidence` columns (already completed in ensureSheets).
  - [ ] 3.4 Create batch processing function to handle large numbers of staging transactions efficiently.
  - [ ] 3.5 Add progress feedback and error handling for bulk categorization operations.
  - [ ] 3.6 Implement `showAutoCategorizeDialog()` to launch categorization with progress indicator.

- [ ] 4.0 Rule Management and Analytics
  - [ ] 4.1 Add "Manage Category Rules" menu item to view/edit rules in a dialog interface.
  - [ ] 4.2 Implement rule usage statistics tracking (count how often each rule is used).
  - [ ] 4.3 Create rule testing interface - test patterns against sample transactions.
  - [ ] 4.4 Add rule import/export functionality for backup and sharing.
  - [ ] 4.5 Implement rule conflict detection and duplicate pattern warnings.
  - [ ] 4.6 Add bulk rule operations (enable/disable, priority adjustment).

- [ ] 5.0 Enhanced Import Pipeline Integration
  - [ ] 5.1 Add toggle option in import dialog to enable/disable auto-categorization during import.
  - [ ] 5.2 Modify CSV import functions to optionally call auto-categorization.
  - [ ] 5.3 Add import-time categorization performance monitoring and alerts.
  - [ ] 5.4 Implement smart categorization - only auto-categorize high confidence matches during import.
  - [ ] 5.5 Add categorization summary in import completion toast (X auto-categorized, Y need review).

- [ ] 6.0 Advanced Features and Optimization
  - [ ] 6.1 Implement machine learning suggestions based on user corrections and patterns.
  - [ ] 6.2 Add category spending insights integration (auto-categorized vs manual trends).
  - [ ] 6.3 Create scheduled auto-categorization (daily/weekly batch processing).
  - [ ] 6.4 Add transaction similarity detection for improved rule suggestions.
  - [ ] 6.5 Implement rule performance optimization (most-used rules prioritized in matching order).
  - [ ] 6.6 Add integration with external categorization services (Plaid, Yodlee) for rule seeding. 

- [ ] 7.0 Apply Fixes and Improvements from Code Review
  - [ ] 7.1 Add check in ensureSheets to avoid duplicating existing sheets.
    - Check if sheet exists using ss.getSheetByName(sheetName); if yes, verify headers match and update if needed.
    - If not, proceed with insertSheet and appendRow(headers).
  - [ ] 7.2 Enhance detectBank to scan first few lines for more robust header detection.
    - Modify to check the first 3-5 lines instead of just the first.
    - Adjust regex to handle potential variations or headers in data rows.
  - [ ] 7.3 Add fallback alert and logging for bank detection failures in importCsvFiles.
    - If bank is null, log a snippet of the content (first 100 chars) to Logger.
    - Show a user alert with file index and suggest checking CSV format.
  - [ ] 7.4 Implement skipping logic in import functions to properly count rowsSkipped (e.g., for invalid or duplicate rows).
    - In the parsing loop, add conditions to skip rows (e.g., if date/vendor/amount invalid or duplicate in staging).
    - Update rowsSkipped counter accordingly before setting rowsToInsert.
  - [ ] 7.5 Verify and adjust AMEX amount handling using sample data.
    - Test with activity.csv to confirm if positives are credits or debits.
    - Update the finalAmount logic if needed (e.g., keep positives as is for refunds).
  - [ ] 7.6 Add duplicate checking in import functions to prevent re-imports.
    - Before pushing to parsed, check if [date, vendor, amount, source] combo exists in staging sheet.
    - If duplicate, skip and increment rowsSkipped.
  - [ ] 7.7 Remove or consolidate duplicate function showImportStgToTxnDialog.
    - Delete showImportStgToTxnDialog if unused.
    - If needed, merge its code into showImportToLedgerDialog.
  - [ ] 7.8 Make txType derivation configurable per bank in matchTransactionToRules.
    - Add a bank parameter to the function.
    - Adjust txType logic based on bank-specific rules (e.g., for AMEX negatives always Debit).
  - [ ] 7.9 Add progress indicators for large imports in importCsvFiles.
    - Use pcToast to show progress every 100 rows processed.
    - Calculate percentage based on total rows across all files.
  - [ ] 7.10 Sort appended rows by date in importToTransactions after insertion.
    - After setting values in tx sheet, get the new range.
    - Call tx.sort(1, true) to sort by Date column ascending. 