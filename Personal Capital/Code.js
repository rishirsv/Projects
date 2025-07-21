/**
 * Builds the custom “Personal Capital” menu each time the file is opened.
 */
// ───────── SHEET CONSTANTS ─────────
const SH_STG = 'STG_Transactions';         // sheet holding imported but uncategorised rows
const SH_TX  = 'Transactions';    // ledger / final destination
const SH_LOG = 'SYS_ImportLog';   // import statistics log
const SH_RULES = 'SYS_CatRules';  // categorization rules

/**
 * High‑resolution timestamp helper (ms).
 * Replaces deprecated Utilities.getCpuTime().
 */
function nowMs() {
  return Date.now();
}

/** Simple toast wrapper */
function pcToast(msg, title, secs){ SpreadsheetApp.getActive().toast(msg, title||'Import', secs||3); }

/**
 * Ensures required sheets exist, creating them if necessary
 */
function ensureSheets() {
  const ss = SpreadsheetApp.getActive();
  const requiredSheets = {
    [SH_STG]: ['Date', 'Vendor', 'Amount', 'Category', 'Source', 'RuleID', 'Confidence'],
    [SH_TX]: ['Date', 'Vendor', 'Amount', 'Category', 'Source'],
    [SH_LOG]: ['Timestamp', 'Bank', 'Rows Read', 'Rows Kept', 'Rows Skipped'],
    [SH_RULES]: ['Pattern', 'Category', 'Priority', 'MinAmt', 'MaxAmt', 'Type', 'Notes']
  };
  
  for (const [sheetName, headers] of Object.entries(requiredSheets)) {
    if (!ss.getSheetByName(sheetName)) {
      const sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      // Hide system sheets
      if (sheetName.startsWith('SYS_')) {
        sheet.hideSheet();
      }
    }
  }
}

/**
 * Logs import statistics to the import log sheet
 */
function logImportStats(bank, rowsRead, rowsKept, rowsSkipped) {
  try {
    const ss = SpreadsheetApp.getActive();
    let logSheet = ss.getSheetByName(SH_LOG);
    if (!logSheet) {
      ensureSheets();
      logSheet = ss.getSheetByName(SH_LOG);
    }
    
    logSheet.appendRow([
      new Date(),
      bank,
      rowsRead,
      rowsKept,
      rowsSkipped
    ]);
  } catch (e) {
    Logger.log('Failed to log import stats: ' + e.toString());
  }
}

/**
 * Bank detection patterns and column mappings
 */
const BANK_CONFIGS = {
  AMEX: {
    headerRegex: /^date.*description.*amount/i,
    hasHeader: true,
    dateCol: 0,
    vendorCol: 2, 
    amountCol: 3,
    debitNegative: false  // AMEX uses negative for debits
  },
  CIBC: {
    headerRegex: /^\d{4}-\d{2}-\d{2}/,  // starts with date pattern
    hasHeader: false,
    dateCol: 0,
    vendorCol: 1,
    debitCol: 2,
    creditCol: 3,
    debitNegative: true
  },
  SIMPLII: {
    headerRegex: /funds.*out/i,  // has "Funds Out" column
    hasHeader: true,
    dateCol: 0,
    vendorCol: 1,
    debitCol: 2,
    creditCol: 3,
    debitNegative: true
  }
};

/**
 * Auto-detect bank from CSV content
 */
function detectBank(content) {
  const firstLine = content.split('\n')[0].toLowerCase();
  
  for (const [bank, config] of Object.entries(BANK_CONFIGS)) {
    if (config.headerRegex.test(firstLine)) {
      return bank;
    }
  }
  return null;
}

/**
 * Generic CSV import function that auto-detects bank and routes to appropriate parser
 */
function importCsvFiles(files) {
  ensureSheets();
  let totalProcessed = 0;
  let totalErrors = 0;
  
  try {
    const fileArr = Array.isArray(files) ? files.filter(Boolean) : (files ? [files] : []);
    if (fileArr.length === 0) {
      SpreadsheetApp.getUi().alert('No files selected for import.');
      return;
    }
    
    pcToast(`Processing ${fileArr.length} file(s)...`, 'Import', 3);
    
    fileArr.forEach((file, idx) => {
      try {
        const content = file.getBlob ? file.getBlob().getDataAsString() : file.content;
        const bank = detectBank(content);
        
        if (!bank) {
          SpreadsheetApp.getUi().alert(`Could not detect bank format for file ${idx + 1}`);
          totalErrors++;
          return;
        }
        
        // Route to appropriate parser
        switch (bank) {
          case 'AMEX':
            importAmexCSV([{content}]);
            break;
          case 'CIBC':
            importCIBCCSV([{content}]);
            break;
          case 'SIMPLII':
            importSimpliiCSV([{content}]);
            break;
        }
        totalProcessed++;
        
      } catch (e) {
        Logger.log(`Error processing file ${idx + 1}: ${e.toString()}`);
        totalErrors++;
      }
    });
    
    const msg = `Import complete: ${totalProcessed} files processed` + 
                (totalErrors > 0 ? `, ${totalErrors} errors` : '');
    pcToast(msg, 'Import Complete', 4);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('Import failed: ' + e.toString());
    throw e;
  }
}

function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Personal Capital')
    .addItem('Import CSV(s)…',        'showImportDialog')
    .addSeparator()
    .addItem('Auto-Categorize Staging Transactions…', 'showAutoCategorizeDialog')
    .addSeparator()
    .addItem('Import Staging → Transactions…', 'showImportToLedgerDialog')
    .addToUi();
  ensureSheets();
}

/**
 * Shows the generic CSV import dialog
 */
function showImportDialog() {
  const html = HtmlService
      .createHtmlOutputFromFile('ImportDialog')
      .setWidth(650)
      .setHeight(400);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Import CSV Files');
}

function importAmexCSV(files){
  // counters live in outer scope so they're always defined
  let rowsRead = 0, rowsKept = 0, rowsSkipped = 0;
  Logger.log('🔵 importAmexCSV triggered, got ' + (files?.length || 0) + ' file(s)');
  SpreadsheetApp.getActive().toast('Starting AMEX import…', 'Import', 2);
  try {
    ensureSheets();
    const ss = SpreadsheetApp.getActive();
    const stg = ss.getSheetByName(SH_STG);
    const config = BANK_CONFIGS.AMEX;
    
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

      // skip header row if present
      const startIdx = config.hasHeader ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        
        // Extract and format data according to AMEX schema
        const dateStr = parts[config.dateCol]?.trim();
        const vendor = parts[config.vendorCol]?.trim();
        const amountStr = parts[config.amountCol]?.trim();
        
        if (!dateStr || !vendor || !amountStr) continue;
        
        try {
          const date = new Date(dateStr);
          const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
          
          if (isNaN(date.getTime()) || isNaN(amount)) continue;
          
          // AMEX: negative values are debits (spending)
          // AMEX: Convert all amounts to negative (expenses)
          const finalAmount = amount > 0 ? -amount : amount;
          parsed.push([date, vendor, finalAmount, '', 'AMEX']);
        } catch (e) {
          Logger.log(`Error parsing AMEX row ${i}: ${e.toString()}`);
          continue;
        }
      }

      rowsRead += parsed.length;

      const rowsToInsert = parsed;

      rowsKept   += rowsToInsert.length;
      rowsSkipped += parsed.length - rowsToInsert.length;

      // Write to staging sheet
      if (rowsToInsert.length > 0) {
        const destStart = stg.getLastRow() + 1;
        stg.getRange(destStart, 1, rowsToInsert.length, 5).setValues(rowsToInsert);
      }
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
    ensureSheets();
    const ss = SpreadsheetApp.getActive();
    const stg = ss.getSheetByName(SH_STG);
    const config = BANK_CONFIGS.CIBC;
    
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

      // CIBC has no header row
      const startIdx = config.hasHeader ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        
        // Extract and format data according to CIBC schema
        const dateStr = parts[config.dateCol]?.trim();
        const vendor = parts[config.vendorCol]?.trim();
        const debitStr = parts[config.debitCol]?.trim() || '0';
        const creditStr = parts[config.creditCol]?.trim() || '0';
        
        if (!dateStr || !vendor) continue;
        
        try {
          const date = new Date(dateStr);
          const debit = parseFloat(debitStr.replace(/[^0-9.-]/g, '')) || 0;
          const credit = parseFloat(creditStr.replace(/[^0-9.-]/g, '')) || 0;
          
          if (isNaN(date.getTime())) continue;
          
          // CIBC: debit = spending (negative), credit = income (positive)
          const amount = credit - debit;
          
          parsed.push([date, vendor, amount, '', 'CIBC']);
        } catch (e) {
          Logger.log(`Error parsing CIBC row ${i}: ${e.toString()}`);
          continue;
        }
      }

      rowsRead += parsed.length;

      const rowsToInsert = parsed;

      rowsKept   += rowsToInsert.length;
      rowsSkipped += parsed.length - rowsToInsert.length;

      // Write to staging sheet
      if (rowsToInsert.length > 0) {
        const destStart = stg.getLastRow() + 1;
        stg.getRange(destStart, 1, rowsToInsert.length, 5).setValues(rowsToInsert);
      }
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
    ensureSheets();
    const ss = SpreadsheetApp.getActive();
    const stg = ss.getSheetByName(SH_STG);
    const config = BANK_CONFIGS.SIMPLII;
    
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

      // skip header row if present
      const startIdx = config.hasHeader ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        
        // Extract and format data according to Simplii schema
        const dateStr = parts[config.dateCol]?.trim();
        const vendor = parts[config.vendorCol]?.trim();
        const debitStr = parts[config.debitCol]?.trim() || '0';
        const creditStr = parts[config.creditCol]?.trim() || '0';
        
        if (!dateStr || !vendor) continue;
        
        try {
          const date = new Date(dateStr);
          const debit = parseFloat(debitStr.replace(/[^0-9.-]/g, '')) || 0;
          const credit = parseFloat(creditStr.replace(/[^0-9.-]/g, '')) || 0;
          
          if (isNaN(date.getTime())) continue;
          
          // Simplii: debit = spending (negative), credit = income (positive)
          const amount = credit - debit;
          
          parsed.push([date, vendor, amount, '', 'SIMPLII']);
        } catch (e) {
          Logger.log(`Error parsing Simplii row ${i}: ${e.toString()}`);
          continue;
        }
      }

      rowsRead += parsed.length;

      const rowsToInsert = parsed;

      rowsKept   += rowsToInsert.length;
      rowsSkipped += parsed.length - rowsToInsert.length;

      // Write to staging sheet
      if (rowsToInsert.length > 0) {
        const destStart = stg.getLastRow() + 1;
        stg.getRange(destStart, 1, rowsToInsert.length, 5).setValues(rowsToInsert);
      }
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

// ───────── CATEGORIZATION RULE ENGINE ─────────

/**
 * Loads category rules from SYS_CatRules sheet and caches them
 * Returns compiled rules sorted by priority
 */
function loadCategoryRules() {
  try {
    const cacheKey = 'CATEGORY_RULES_CACHE';
    const properties = PropertiesService.getDocumentProperties();
    const cached = properties.getProperty(cacheKey);
    
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Check if cache is still valid (less than 1 hour old)
      if (Date.now() - cachedData.timestamp < 3600000) {
        return cachedData.rules.map(rule => ({
          ...rule,
          compiledRegex: new RegExp(rule.Pattern, 'i'),
          minAmt: rule.MinAmt ? parseFloat(rule.MinAmt) : null,
          maxAmt: rule.MaxAmt ? parseFloat(rule.MaxAmt) : null
        }));
      }
    }
    
    const ss = SpreadsheetApp.getActive();
    let rulesSheet = ss.getSheetByName(SH_RULES);
    
    if (!rulesSheet) {
      ensureSheets();
      rulesSheet = ss.getSheetByName(SH_RULES);
    }
    
    const data = rulesSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return []; // No rules defined yet
    }
    
    const headers = data[0];
    const rules = data.slice(1)
      .filter(row => row[0] && row[1]) // Must have Pattern and Category
      .map(row => {
        const rule = {};
        headers.forEach((header, index) => {
          rule[header] = row[index];
        });
        return rule;
      })
      .sort((a, b) => (a.Priority || 999) - (b.Priority || 999)); // Sort by priority
    
    // Cache the rules
    properties.setProperty(cacheKey, JSON.stringify({
      rules: rules,
      timestamp: Date.now()
    }));
    
    // Return compiled rules
    return rules.map(rule => ({
      ...rule,
      compiledRegex: new RegExp(rule.Pattern, 'i'),
      minAmt: rule.MinAmt ? parseFloat(rule.MinAmt) : null,
      maxAmt: rule.MaxAmt ? parseFloat(rule.MaxAmt) : null
    }));
    
  } catch (e) {
    Logger.log('Error loading category rules: ' + e.toString());
    return [];
  }
}

/**
 * Saves a new categorization rule to the SYS_CatRules sheet
 */
function saveCategoryRule(pattern, category, priority, minAmt, maxAmt, type, notes) {
  try {
    const ss = SpreadsheetApp.getActive();
    let rulesSheet = ss.getSheetByName(SH_RULES);
    
    if (!rulesSheet) {
      ensureSheets();
      rulesSheet = ss.getSheetByName(SH_RULES);
    }
    
    const newRule = [
      pattern || '',
      category || '',
      priority || 200,
      minAmt || '',
      maxAmt || '',
      type || 'Any',
      notes || ''
    ];
    
    rulesSheet.appendRow(newRule);
    
    // Invalidate cache
    PropertiesService.getDocumentProperties().deleteProperty('CATEGORY_RULES_CACHE');
    
    Logger.log(`Saved new rule: ${pattern} -> ${category} (Priority: ${priority})`);
    return true;
    
  } catch (e) {
    Logger.log('Error saving category rule: ' + e.toString());
    return false;
  }
}

/**
 * Matches a transaction against categorization rules
 * Returns {category, ruleId, confidence} or {category: '', ruleId: null, confidence: 'Low'}
 */
function matchTransactionToRules(vendor, amount, transactionType, rules) {
  if (!rules || rules.length === 0) {
    return {category: '', ruleId: null, confidence: 'Low'};
  }
  
  const vendorLower = (vendor || '').toLowerCase().trim();
  const numAmount = parseFloat(amount) || 0;
  const txType = transactionType || (numAmount < 0 ? 'Debit' : 'Credit');
  
  for (const rule of rules) {
    try {
      // Check transaction type match
      if (rule.Type && rule.Type !== 'Any' && rule.Type !== txType) {
        continue;
      }
      
      // Check amount range
      if (rule.minAmt !== null && numAmount < rule.minAmt) {
        continue;
      }
      if (rule.maxAmt !== null && numAmount > rule.maxAmt) {
        continue;
      }
      
      // Check regex pattern match
      if (rule.compiledRegex && rule.compiledRegex.test(vendorLower)) {
        const confidence = getConfidenceLevel(rule.Priority || 999);
        return {
          category: rule.Category,
          ruleId: rule.Priority || 999,
          confidence: confidence
        };
      }
      
    } catch (e) {
      Logger.log(`Error evaluating rule ${rule.Priority}: ${e.toString()}`);
      continue;
    }
  }
  
  return {category: '', ruleId: null, confidence: 'Low'};
}

/**
 * Determines confidence level based on rule priority
 */
function getConfidenceLevel(priority) {
  if (priority <= 50) return 'High';
  if (priority <= 150) return 'Medium';
  return 'Low';
}

/**
 * Auto-categorizes a single transaction using the rule engine
 * Returns {category, ruleId, confidence}
 */
function autoCategorizeTransaction(vendor, amount, sourceBank) {
  try {
    const startTime = nowMs();
    const rules = loadCategoryRules();
    const loadTime = nowMs() - startTime;
    
    if (loadTime > 100) { // Log if rule loading takes more than 100ms
      Logger.log(`Rule loading took ${loadTime}ms for ${rules.length} rules`);
    }
    
    const transactionType = amount < 0 ? 'Debit' : 'Credit';
    const result = matchTransactionToRules(vendor, amount, transactionType, rules);
    
    return result;
    
  } catch (e) {
    Logger.log(`Error auto-categorizing transaction: ${e.toString()}`);
    return {category: '', ruleId: null, confidence: 'Low'};
  }
}

/**
 * Performance benchmark for rule evaluation
 * Tests rule matching performance against target of ≤2s for 2000 rows
 */
function benchmarkRulePerformance() {
  const testTransactions = [
    {vendor: 'STARBUCKS', amount: -5.25},
    {vendor: 'PAYROLL DEPOSIT KPMG', amount: 3000.00},
    {vendor: 'UBER TRIP', amount: -15.50},
    {vendor: 'LOBLAWS', amount: -85.43},
    {vendor: 'AMEX BANK', amount: -250.00}
  ];
  
  const numIterations = 400; // 400 * 5 = 2000 transactions
  const startTime = nowMs();
  
  for (let i = 0; i < numIterations; i++) {
    for (const tx of testTransactions) {
      autoCategorizeTransaction(tx.vendor, tx.amount, 'TEST');
    }
  }
  
  const totalTime = nowMs() - startTime;
  const avgTimePerTransaction = totalTime / (numIterations * testTransactions.length);
  
  Logger.log(`Benchmark Results:`);
  Logger.log(`Total time for 2000 transactions: ${totalTime}ms`);
  Logger.log(`Average time per transaction: ${avgTimePerTransaction}ms`);
  Logger.log(`Target met: ${totalTime <= 2000 ? 'YES' : 'NO'}`);
  
  return {
    totalTime: totalTime,
    avgTimePerTransaction: avgTimePerTransaction,
    targetMet: totalTime <= 2000
  };
}

// ───────── BATCH AUTO-CATEGORIZATION ─────────

/**
 * Runs auto-categorization on all transactions in the staging sheet
 * Processes in batches for performance and provides progress feedback
 */
function runAutoCategorization() {
  const startTime = nowMs();
  let processed = 0, categorized = 0, errors = 0;
  
  try {
    const ss = SpreadsheetApp.getActive();
    const stagingSheet = ss.getSheetByName(SH_STG);
    
    if (!stagingSheet) {
      SpreadsheetApp.getUi().alert('Staging sheet not found. Please import some transactions first.');
      return;
    }
    
    const data = stagingSheet.getDataRange().getValues();
    if (data.length <= 1) {
      SpreadsheetApp.getUi().alert('No transactions found in staging sheet.');
      return;
    }
    
    const headers = data[0];
    const transactions = data.slice(1);
    
    // Find column indices
    const vendorCol = headers.indexOf('Vendor');
    const amountCol = headers.indexOf('Amount');
    const categoryCol = headers.indexOf('Category');
    const ruleIdCol = headers.indexOf('RuleID');
    const confidenceCol = headers.indexOf('Confidence');
    
    if (vendorCol === -1 || amountCol === -1) {
      SpreadsheetApp.getUi().alert('Required columns (Vendor, Amount) not found in staging sheet.');
      return;
    }
    
    pcToast(`Starting auto-categorization of ${transactions.length} transactions...`, 'Auto-Categorize', 3);
    
    // Load rules once for all transactions
    const rules = loadCategoryRules();
    if (rules.length === 0) {
      SpreadsheetApp.getUi().alert('No categorization rules found. Please add some rules first.');
      return;
    }
    
    Logger.log(`Loaded ${rules.length} rules for categorization`);
    
    // Process transactions in batches
    const batchSize = 100;
    const updates = [];
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, Math.min(i + batchSize, transactions.length));
      
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const vendor = row[vendorCol];
        const amount = parseFloat(row[amountCol]) || 0;
        
        try {
          const result = matchTransactionToRules(vendor, amount, null, rules);
          
          // Only update if we got a category (don't overwrite existing categories with empty)
          if (result.category) {
            // Prepare update for this row (1-based indexing, accounting for header)
            const rowIndex = i + j + 2;
            updates.push({
              row: rowIndex,
              category: result.category,
              ruleId: result.ruleId,
              confidence: result.confidence
            });
            categorized++;
          }
          
          processed++;
          
        } catch (e) {
          Logger.log(`Error categorizing transaction ${i + j + 1}: ${e.toString()}`);
          errors++;
          processed++;
        }
      }
      
      // Apply batch updates to sheet
      if (updates.length > 0) {
        const batchUpdates = updates.splice(0, updates.length);
        applyCategorizationUpdates(stagingSheet, batchUpdates, categoryCol, ruleIdCol, confidenceCol);
      }
      
      // Progress feedback every 200 transactions
      if ((i + batchSize) % 200 === 0 || i + batchSize >= transactions.length) {
        const progress = Math.min(i + batchSize, transactions.length);
        pcToast(`Processed ${progress}/${transactions.length} transactions (${categorized} categorized)`, 'Auto-Categorize', 1);
      }
    }
    
    const totalTime = nowMs() - startTime;
    const successMsg = `Auto-categorization complete!\n\n` +
                      `Processed: ${processed} transactions\n` +
                      `Categorized: ${categorized} transactions\n` +
                      `Errors: ${errors}\n` +
                      `Time: ${Math.round(totalTime)}ms`;
    
    SpreadsheetApp.getUi().alert(successMsg);
    Logger.log(successMsg);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('Auto-categorization failed: ' + e.toString());
    Logger.log('Auto-categorization error: ' + e.toString());
  }
}

/**
 * Applies categorization updates to the staging sheet in batch
 */
function applyCategorizationUpdates(sheet, updates, categoryCol, ruleIdCol, confidenceCol) {
  if (updates.length === 0) return;
  
  try {
    // Group updates by column to minimize API calls
    const categoryUpdates = [];
    const ruleIdUpdates = [];
    const confidenceUpdates = [];
    
    for (const update of updates) {
      if (categoryCol !== -1) {
        categoryUpdates.push([update.row, categoryCol + 1, update.category]);
      }
      if (ruleIdCol !== -1) {
        ruleIdUpdates.push([update.row, ruleIdCol + 1, update.ruleId]);
      }
      if (confidenceCol !== -1) {
        confidenceUpdates.push([update.row, confidenceCol + 1, update.confidence]);
      }
    }
    
    // Apply updates in batches
    if (categoryUpdates.length > 0) {
      categoryUpdates.forEach(([row, col, value]) => {
        sheet.getRange(row, col).setValue(value);
      });
    }
    
    if (ruleIdUpdates.length > 0) {
      ruleIdUpdates.forEach(([row, col, value]) => {
        sheet.getRange(row, col).setValue(value);
      });
    }
    
    if (confidenceUpdates.length > 0) {
      confidenceUpdates.forEach(([row, col, value]) => {
        sheet.getRange(row, col).setValue(value);
      });
    }
    
  } catch (e) {
    Logger.log('Error applying categorization updates: ' + e.toString());
    throw e;
  }
}

/**
 * Shows the auto-categorization dialog/confirmation
 */
function showAutoCategorizeDialog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Auto-Categorize Staging Transactions',
    'This will automatically categorize all transactions in the staging sheet using your categorization rules.\n\n' +
    'Existing categories will not be overwritten.\n\n' +
    'Do you want to continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    runAutoCategorization();
  }
}
