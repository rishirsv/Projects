# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script-based personal finance management system that integrates with Google Sheets. The system imports CSV files from multiple banks (AMEX, CIBC, Simplii), categorizes transactions using a rule-based engine, and provides spending insights.

## Architecture

### Core Components

- **`Code.js`**: Main Google Apps Script file containing all server-side logic
- **HTML Dialogs**: Client-side UI components for various operations
- **Google Sheets Integration**: Uses specific sheet names for data storage and processing

### Data Flow Architecture

1. **Import Stage**: CSV files → `STG_Transactions` sheet (staging area)
2. **Processing Stage**: Auto-categorization using rules from `SYS_CatRules` sheet
3. **Final Stage**: Reviewed transactions → `Transactions` sheet (final ledger)

### Sheet Structure

- `STG_Transactions`: Staging area with columns: Date, Vendor, Amount, Category, Source, RuleID, Confidence
- `Transactions`: Final ledger with columns: Date, Vendor, Amount, Category, Source
- `SYS_CatRules`: Categorization rules (hidden sheet)
- `SYS_ImportLog`: Import statistics (hidden sheet)

## Development Commands

### Deployment
```bash
# Login to Google Apps Script
clasp login

# Deploy changes to Google Apps Script
clasp push

# Pull latest from Google Apps Script
clasp pull
```

### Local Development
This project uses CLASP (Command Line Apps Script) for local development. The `.clasp.json` file contains the script ID and configuration.

## Key Constants and Configuration

### Sheet Names (Code.js:4-8)
```javascript
const SH_STG = 'STG_Transactions';    // Staging sheet
const SH_TX = 'Transactions';         // Final ledger
const SH_LOG = 'SYS_ImportLog';       // Import logs (hidden)
const SH_RULES = 'SYS_CatRules';      // Category rules (hidden)
```

### Bank Configurations (Code.js:73-100)
The system supports three bank formats with auto-detection:
- **AMEX**: Header-based, single amount column, negative values for debits
- **CIBC**: No header, separate debit/credit columns
- **SIMPLII**: Header-based with "Funds Out" indicator, separate debit/credit columns

## Key Functions and APIs

### Import Functions
- `importCsvFiles(files)`: Auto-detects bank format and routes to appropriate parser
- `importAmexCSV(files)`, `importCIBCCSV(files)`, `importSimpliiCSV(files)`: Bank-specific parsers
- `importToTransactions({from, to})`: Moves transactions from staging to final ledger

### Categorization Engine
- `loadCategoryRules()`: Loads and caches categorization rules
- `autoCategorizeTransaction(vendor, amount, sourceBank)`: Categorizes single transaction
- `runAutoCategorization()`: Batch processes all staging transactions
- `matchTransactionToRules()`: Core rule matching logic

### Rule Management
- `saveCategoryRule(pattern, category, priority, minAmt, maxAmt, type, notes)`: Saves new rules
- Rules support regex patterns, amount ranges, and transaction types
- Rules are cached for performance (1-hour TTL)

## Performance Requirements

- **Target**: Process 2,000-row CSVs in ≤2 seconds
- **Batch Processing**: Transactions processed in batches of 100
- **Rule Caching**: Category rules cached with 1-hour expiration
- **Progress Feedback**: Every 200 transactions during auto-categorization

## Menu Structure

The system adds a "Personal Capital" menu to Google Sheets with:
1. Import CSV(s)... → `showImportDialog()`
2. Auto-Categorize Staging Transactions... → `showAutoCategorizeDialog()`
3. Import Staging → Transactions... → `showImportToLedgerDialog()`

## HTML Dialogs

- `ImportDialog.html`: CSV file upload interface
- `ImportToLedgerDialog.html`: Date range picker for staging-to-ledger transfer
- Additional dialogs for review and insights (referenced but files not present)

## Error Handling and Logging

- Uses `Logger.log()` for server-side logging
- `pcToast()` helper for user notifications
- Import statistics logged to `SYS_ImportLog` sheet
- Graceful handling of malformed CSV data

## Testing and Validation

- `benchmarkRulePerformance()`: Performance testing for rule engine
- Target: ≤2s for 2,000 transactions
- Import validation includes date parsing, amount validation, and duplicate detection

## Python Analysis Scripts

### Net Worth Analysis (`process_net_worth.py`)
Processes Personal Capital Net Worth CSV exports into monthly digest format.

**Usage**: `python3 process_net_worth.py`

**Input**: `docs/Net Worth.csv` (Personal Capital export)
**Output**: `PF_NetWorth_Digest.csv` (monthly digest)

**Output Format**: One row per month with columns:
- `date`, `totalNW`, `cryptoVal`, `cryptoPct`, `equitiesVal`, `fixedIncomeVal`, `cashVal`, `otherVal`
- `MoM_pct`, `YoY_pct`, `rolling_12m_return`, `rolling_12m_stdev`, `max_drawdown_to_date`, `milestone_flag`

**Asset Classification**:
- **Cash**: Bank accounts, line of credit, savings
- **Equities**: TFSA, RRSP, IKBR, margin accounts, FHSA
- **Fixed Income**: Manulife RPP
- **Crypto**: Phantom Wallet, Blue Wallet, cryptocurrency holdings
- **Other**: Unclassified assets

**Key Metrics**:
- Milestone flags for 100k CAD boundaries
- Rolling 12-month returns and volatility
- Maximum drawdown tracking
- Month-over-month and year-over-year percentage changes

### IBKR Portfolio Analysis (`process_ibkr_digests.py`)
Processes IBKR portfolio exports into 4 digest files for comprehensive investment analysis.

**Usage**: `python3 process_ibkr_digests.py`

**Inputs**: 
- `docs/IKBR Portfolio - Inception to Date.csv` (IBKR performance export)
- `docs/IKBR Portfolio - Transaction History.csv` (IBKR transaction history)

**Outputs**:

1. **PF_IBKR_Performance_Digest.csv**: Performance metrics by period
   - Columns: `period`, `navStart`, `navEnd`, `return_pct`, `alpha_vs_SPY`, `beta_vs_SPY`, `sharpe`, `sortino`, `stdev`, `max_drawdown_pct`, `benchmark_SPY_return`, `outperformance_pct`
   - Periods: MTD, QTD, YTD, 1Y, 3Y, 5Y, 10Y, ITD

2. **PF_IBKR_Allocation_Digest.csv**: Current holdings allocation analysis  
   - Columns: `ticker`, `securityName`, `sector`, `accountType`, `marketValue_CAD`, `weight_pct`, `unrealized_gain_pct`, `dividendYield`, `country`, `assetClass`
   - Includes aggregate rows by asset class (TOTAL_EQUITY, TOTAL_CASH)

3. **PF_IBKR_Position_Digest.csv**: Top/bottom performing positions
   - Columns: `rank`, `ticker`, `securityName`, `accountType`, `marketValue_CAD`, `weight_pct`, `12m_return_pct`, `unrealized_gain_pct`, `contribution_to_total_return_pct`  
   - Top 25 and bottom 10 performers by 12-month return

4. **PF_Cashflow_Digest.csv**: Quarterly cashflow analysis
   - Columns: `year`, `quarter`, `accountType`, `deposits`, `withdrawals`, `dividends`, `interest`, `fees`, `netCashflow`
   - Categorizes all transactions by type and account

**Key Features**:
- Auto-parses complex IBKR CSV format with 25+ data sections
- Calculates alpha/beta via regression analysis vs S&P 500
- Computes Sharpe/Sortino ratios and risk metrics  
- Handles multi-currency conversion to CAD
- Groups transactions into meaningful cashflow categories

## Common Development Patterns

1. **Sheet Operations**: Always use `ensureSheets()` to verify required sheets exist
2. **Date Handling**: Flexible date parsing with fallback handling
3. **Amount Parsing**: Strip currency symbols and handle negative values per bank format
4. **Error Recovery**: Try-catch blocks with user-friendly error messages
5. **Performance**: Batch operations and caching where possible
6. **Python Analysis**: Use pandas for complex data transformations and financial calculations