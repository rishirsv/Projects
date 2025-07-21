## Relevant Files

- `Personal Capital/Code.js` - Contains incomplete CSV import functions that need the actual sheet insertion logic restored.

### Notes

- The CSV parsing logic exists but the actual sheet insertion (TODO comments) was removed/never implemented.
- Original git history shows the functions had the same structure but with incomplete sheet writing.
- Need to implement the missing sheet insertion and helper functions.
- UI import dialog should be **single and bank-agnostic**; user selects one or more CSV files and the script auto-detects the bank based on header pattern.
- Example CSV files (to study schemas) are stored in a local folder (e.g. `Personal Capital/sample-csv/`):
  - `Activity.csv` → AMEX
  - `cibc.csv`     → CIBC
  - `simplii.csv`   → Simplii
- Each bank has a distinct header pattern that will be used to recognise the source automatically.

## Tasks

- [x] 1.0 Implement Missing Helper Functions
  - [x] 1.1 Create `logImportStats(bank, rowsRead, rowsKept, rowsSkipped)` function to log import statistics.
  - [x] 1.2 Add import statistics logging to a dedicated sheet or console.
  - [x] 1.3 Implement proper error handling and user feedback for import operations.

- [x] 2.0 Complete CSV Data Insertion Logic
  - [x] 2.1 Replace TODO comments with actual sheet insertion in `importAmexCSV()`.
  - [x] 2.2 Replace TODO comments with actual sheet insertion in `importCIBCCSV()`.
  - [x] 2.3 Replace TODO comments with actual sheet insertion in `importSimpliiCSV()`.
  - [x] 2.4 Ensure proper column mapping (Date, Vendor, Amount, Category, Source).
  - [x] 2.5 Auto-detect bank source via header regex and tag rows (`Source` column) accordingly.

- [x] 4.0 Implement Bank-Specific Column Mapping
  - [x] 4.1 Derive AMEX schema from `Activity.csv`: map Date (col 0), Vendor (col 2), Amount (col 3 ‑ negative values for debits).
  - [x] 4.2 Derive CIBC schema from `cibc.csv`: header-less file, map Date (col 0), Vendor (col 1), Debit (col 2), Credit (col 3).
  - [x] 4.3 Derive Simplii schema from `simplii.csv`: header row present, map Date (col 0), Vendor (col 1), Debit (col 2), Credit (col 3).
  - [x] 4.4 Normalize amounts (debit → negative, credit → positive) and unify date formats.

- [x] 5.0 Implement Generic CSV Import Dialog
  - [x] 5.1 Update / create a single `ImportDialog` that allows multi-file selection (drag-and-drop or file picker).
  - [x] 5.2 Remove bank-specific dialog launchers from menu; keep one menu item **"Import CSV(s)…".**
  - [x] 5.3 In the dialog client code, pass the selected file Blob(s) to `importCsvFiles(files)` on the server.
  - [x] 5.4 `importCsvFiles` should iterate files, auto-detect bank, then route to the appropriate parser.

## Implementation Status

✅ **CSV Import Functionality**: COMPLETE
- Auto-detection of AMEX, CIBC, Simplii formats
- Proper column mapping and data normalization  
- Generic import dialog with drag-and-drop
- Sheet creation and data insertion
- Import statistics logging
- AMEX amount conversion fix (all amounts converted to negative) 