// ----------- AUTO-CATEGORIZATION ENGINE -----------

/**
 * Reads CategoryRules from the 'CategoryRules' sheet, returning an array of objects:
 * [
 *   {
 *     pattern: RegExp,
 *     category: string,
 *     priority: number,
 *     minAmount: number or null,
 *     maxAmount: number or null,
 *     type: 'Debit' | 'Credit' | 'Any'
 *   },
 *   ...
 * ]
 */
function getCategoryRules() {
    const ss = SpreadsheetApp.getActive();
    const rulesSheet = ss.getSheetByName(SH_RULES);
    if (!rulesSheet) {
      throw new Error('CategoryRules sheet not found: ' + SH_RULES);
    }
  
    // Fetch data, ignoring the header row.
    const data = rulesSheet.getDataRange().getValues();
    // Expected columns: A=Pattern, B=Category, C=Priority, D=Min, E=Max, F=Type, G=Notes
    // data[0] is header, start from data[1]
    const rules = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const patternStr = row[0] ? String(row[0]).trim() : '.*';
      const category   = row[1] ? String(row[1]).trim() : 'Uncategorized';
      const priority   = row[2] ? parseFloat(row[2]) : 9999;
      const minAmount  = row[3] !== '' && row[3] != null ? parseFloat(row[3]) : null;
      const maxAmount  = row[4] !== '' && row[4] != null ? parseFloat(row[4]) : null;
      const type       = row[5] ? String(row[5]).trim() : 'Any';
  
      // Build a regex object. Use case-insensitive matching.
      let pattern;
      try {
        pattern = new RegExp(patternStr, 'i');
      } catch (err) {
        // In case of invalid patterns, skip this rule or set a fallback
        pattern = /.*/i;
      }
  
      rules.push({
        pattern,
        category,
        priority,
        minAmount,
        maxAmount,
        type
      });
    }
  
    // Sort by ascending priority
    rules.sort((a, b) => a.priority - b.priority);
  
    return rules;
  }
  
  /**
   * Auto-categorizes rows in STG_Transactions using the CategoryRules sheet.
   * Called on "Auto-Categorize Staging" menu and optionally after CSV import.
   */
  function autoCategorizeStaging() {
    const ss = SpreadsheetApp.getActive();
    const stgSheet = ss.getSheetByName(SH_STG);
    if (!stgSheet) {
      safeToast('No staging sheet found. Please create it or check the sheet name.', 'Error', 5);
      return;
    }
  
    // Read rules
    const rules = getCategoryRules();
  
    // Retrieve staging data
    // Staging columns: A=Date, B=Vendor, C=Amount, D=Category, E=Source
    // We want to categorize based on Vendor, Amount, and if Category is blank or 'Uncategorized'
    const lastRow = stgSheet.getLastRow();
    if (lastRow < 2) {
      safeToast('No transactions in staging to categorize.', 'Info', 4);
      return;
    }
    const dataRange = stgSheet.getRange(2, 1, lastRow - 1, 5); // Exclude header row
    const values = dataRange.getValues();
  
    // Process each row
    for (let i = 0; i < values.length; i++) {
      let [date, vendor, amount, category, source] = values[i];
  
      // If category is already non-empty, skip or remove this check if you want to re-categorize anyway
      if (String(category).trim()) {
        continue; 
      }
  
      // Determine transaction sign -> type
      // Negative amount = Debit, Positive = Credit, Zero = treat as Credit or handle specially
      const txnType = (amount < 0) ? 'Debit' : 'Credit';
      let matchedCategory = '';
  
      // Attempt to match a rule
      for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        const { pattern, category: cat, priority, minAmount, maxAmount, type } = rule;
  
        // Check vendor against pattern
        if (!pattern.test(String(vendor))) {
          continue;
        }
  
        // Check type match
        if (type !== 'Any' && type !== txnType) {
          continue;
        }
  
        // Check amount range if specified (compare absolute value to capture debits)
        const absAmount = Math.abs(amount);
        if (minAmount !== null && absAmount < minAmount) {
          continue;
        }
        if (maxAmount !== null && absAmount > maxAmount) {
          continue;
        }
  
        // If all checks pass, assign category and stop
        matchedCategory = cat;
        break;
      }
  
      // If no match found, fallback to 'Uncategorized'
      if (!matchedCategory) {
        matchedCategory = 'Uncategorized';
      }
  
      values[i][3] = matchedCategory; // 4th column is Category
    }
  
    // Write results back to sheet
    dataRange.setValues(values);
  
    safeToast('Auto-categorization complete.', 'Categorized', 3);
  }