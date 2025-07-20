/**
 * Builds the custom “Personal Capital” menu each time the file is opened.
 */
// ───────── SHEET CONSTANTS ─────────
const SH_STG = 'STG_Transactions';         // sheet holding imported but uncategorised rows
const SH_TX  = 'Transactions';    // ledger / final destination

/** Simple toast wrapper */
function pcToast(msg, title, secs){ SpreadsheetApp.getActive().toast(msg, title||'Import', secs||3); }

function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Personal Capital')
    .addItem('Import AMEX CSV…',      'showImportAmexDialog')
    .addItem('Import CIBC CSV…',      'showImportCIBCD​ialog')
    .addItem('Import Simplii CSV…',   'showImportSimpliiDialog')
    .addSeparator()
    .addItem('Import Staging → Transactions…', 'showImportToLedgerDialog')
    .addSeparator()
    .addItem('Generate Spending Insights…',    'showSpendingInsightsDialog')
    .addToUi();
}

function importAmexCSV(files){
  // counters live in outer scope so they're always defined
  let rowsRead = 0, rowsKept = 0, rowsSkipped = 0;
  Logger.log('🔵 importAmexCSV triggered, got ' + (files?.length || 0) + ' file(s)');
  SpreadsheetApp.getActive().toast('Starting AMEX import…', 'Import', 2);
  try {
    // --- normalise input and handle empty selection ---
    const fileArr = Array.isArray(files) ? files.filter(Boolean) : (files ? [files] : []);
    if (fileArr.length === 0) {
      logImportStats('AMEX', 0, 0, 0);
      return;
    }

    fileArr.forEach(file => {
      // Accept both Blob objects and {content:string} objects
      const content = file.getBlob ? file.getBlob().getDataAsString() : file.content;
      const lines = content.split('\n');
      const parsed = [];

      // skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        parsed.push(line.split(','));
      }

      rowsRead += parsed.length;

      // TODO: apply de‑dupe / filters here
      const rowsToInsert = parsed;

      rowsKept   += rowsToInsert.length;
      rowsSkipped += parsed.length - rowsToInsert.length;

      // TODO: write rowsToInsert to the sheet (e.g., SH_STG) with an "AMEX" source tag
    });
  logImportStats('AMEX', rowsRead, rowsKept, rowsSkipped);
  } catch (e) {
    SpreadsheetApp.getUi().alert('AMEX CSV import failed: ' + e);
    throw e;
  }
}

function importCIBCCSV(files){
  // counters live in outer scope so they're always defined
  let rowsRead = 0, rowsKept = 0, rowsSkipped = 0;
  Logger.log('🔵 importCIBCCSV triggered, got ' + (files?.length || 0) + ' file(s)');
  SpreadsheetApp.getActive().toast('Starting CIBC import…', 'Import', 2);
  try {
    // --- normalise input and handle empty selection ---
    const fileArr = Array.isArray(files) ? files.filter(Boolean) : (files ? [files] : []);
    if (fileArr.length === 0) {
      logImportStats('CIBC', 0, 0, 0);
      return;
    }

    fileArr.forEach(file => {
      // Accept both Blob objects and {content:string} objects
      const content = file.getBlob ? file.getBlob().getDataAsString() : file.content;
      const lines = content.split('\n');
      const parsed = [];

      // skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        parsed.push(line.split(','));
      }

      rowsRead += parsed.length;

      // TODO: apply de‑dupe / filters here
      const rowsToInsert = parsed;

      rowsKept   += rowsToInsert.length;
      rowsSkipped += parsed.length - rowsToInsert.length;

      // TODO: write rowsToInsert to the sheet (e.g., SH_STG) with an "CIBC" source tag
    });
  logImportStats('CIBC', rowsRead, rowsKept, rowsSkipped);
  } catch (e) {
    SpreadsheetApp.getUi().alert('CIBC CSV import failed: ' + e);
    throw e;
  }
}

function importSimpliiCSV(files){
  // counters live in outer scope so they're always defined
  let rowsRead = 0, rowsKept = 0, rowsSkipped = 0;
  Logger.log('🔵 importSimpliiCSV triggered, got ' + (files?.length || 0) + ' file(s)');
  SpreadsheetApp.getActive().toast('Starting SIMPLII import…', 'Import', 2);
  try {
    // --- normalise input and handle empty selection ---
    const fileArr = Array.isArray(files) ? files.filter(Boolean) : (files ? [files] : []);
    if (fileArr.length === 0) {
      logImportStats('SIMPLII', 0, 0, 0);
      return;
    }

    fileArr.forEach(file => {
      // Accept both Blob objects and {content:string} objects
      const content = file.getBlob ? file.getBlob().getDataAsString() : file.content;
      const lines = content.split('\n');
      const parsed = [];

      // skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        parsed.push(line.split(','));
      }

      rowsRead += parsed.length;

      // TODO: apply dse‑dupe / filters here
      const rowsToInsert = parsed;

      rowsKept   += rowsToInsert.length;
      rowsSkipped += parsed.length - rowsToInsert.length;

      // TODO: write rowsToInsert to the sheet (e.g., SH_STG) with an "SIMPLII" source tag
    });
  logImportStats('SIMPLII', rowsRead, rowsKept, rowsSkipped);
  } catch (e) {
    SpreadsheetApp.getUi().alert('SIMPLII CSV import failed: ' + e);
    throw e;
  }
}

function importToTransactions({from, to}) {
  const ss  = SpreadsheetApp.getActive();
  const stg = ss.getSheetByName(SH_STG);
  const tx  = ss.getSheetByName(SH_TX);

  if (!stg || !tx) {
    SpreadsheetApp.getUi().alert(`Sheets “${SH_STG}” or “${SH_TX}” not found.`);
    return;
  }

  // Parse optional date range (HTML passes empty strings when blank)
  const fromDate = from ? new Date(from) : new Date('1900-01-01');
  const toDate   = to   ? new Date(to)   : new Date('9999-12-31');

  const data = stg.getDataRange().getValues();
  if (data.length <= 1) { SpreadsheetApp.getUi().alert('Staging sheet is empty.'); return; }

  const rows   = data.slice(1); // exclude header
  const header = data[0];

  const rowsToMove = [];
  const rowIdxs = [];

  rows.forEach((row, idx) => {
    const d = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (d >= fromDate && d <= toDate) {
      rowsToMove.push(row);
      rowIdxs.push(idx + 2); // account for header and 1-based API
    }
  });

  if (rowsToMove.length === 0) {
    SpreadsheetApp.getUi().alert('No rows matched the selected date range.');
    return;
  }

  // Append to Transactions
  const start = tx.getLastRow() + 1;
  tx.getRange(start, 1, rowsToMove.length, header.length).setValues(rowsToMove);

  // Delete from Staging bottom-up
  rowIdxs.reverse().forEach(r => stg.deleteRow(r));

  pcToast(`Moved ${rowsToMove.length} transaction(s).`, 'Import', 4);
}

/**
 * Opens the "Import Staging → Transactions" dialog.
 */
function showImportStgToTxnDialog() {
  const html = HtmlService
      .createHtmlOutputFromFile('ImportToLedgerDialog')
      .setWidth(400)
      .setHeight(220);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Import Staging → Transactions');
}

/**
 * Opens the "Import Staging → Transactions" dialog.
 */
function showImportToLedgerDialog() {
  const html = HtmlService
      .createHtmlOutputFromFile('ImportToLedgerDialog')
      .setWidth(400)
      .setHeight(220);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Import Staging → Transactions');
}
