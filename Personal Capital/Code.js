/**
 * Builds the custom “Personal Capital” menu each time the file is opened.
 */
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
  // TODO: move rows from staging sheet to Transactions sheet
  // validate `from` / `to`, perform dedupe, write rows, etc.
}

/**
 * Opens the “Import Staging → Transactions” dialog.
 */
function showImportStgToTxnDialog() {
  const html = HtmlService
      .createHtmlOutputFromFile('ImportToLedgerDialog')
      .setWidth(400)
      .setHeight(220);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Import Staging → Transactions');
}
