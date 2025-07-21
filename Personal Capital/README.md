# Personal Capital Expense Tracker

A Google Apps Script-based personal finance management system that integrates with Google Sheets to import, categorize, and analyze financial transactions from multiple bank accounts.

## Overview

This project provides a comprehensive expense tracking solution built on Google Apps Script. It allows users to import CSV files from various banks (AMEX, CIBC, Simplii), categorize transactions, and generate spending insights—all within a Google Sheets environment.

## Features

- **Multi-Bank CSV Import**: Support for AMEX, CIBC, and Simplii bank formats
- **Two-Stage Workflow**: Import to staging area → Review/categorize → Move to final ledger
- **Auto-Categorization**: Rule-based categorization system (to be implemented)
- **Spending Insights**: Visual analytics with charts and comparative metrics
- **Date-Range Filtering**: Selective import from staging to transactions

## Project Structure

### Core Files

#### `Code.js`
The main Google Apps Script file containing all server-side logic:
- **Sheet Constants**: `SH_STG` (STG_Transactions) and `SH_TX` (Transactions)
- **Menu Creation**: `onOpen()` - Builds the custom "Personal Capital" menu
- **Import Functions**:
  - `importAmexCSV()` - Handles AMEX CSV import (TODO: Complete implementation)
  - `importCIBCCSV()` - Handles CIBC CSV import (TODO: Complete implementation)
  - `importSimpliiCSV()` - Handles Simplii CSV import (TODO: Complete implementation)
- **Transfer Function**: `importToTransactions()` - Moves rows from staging to transactions
- **Dialog Launchers**: Functions to open various HTML dialogs

#### `appsscript.json`
Google Apps Script manifest file:
- Timezone: America/Toronto
- Runtime: V8 engine
- Logging: Stackdriver

### HTML Dialogs

#### `ImportDialog.html`
Contains client-side import logic for CSV files. Includes JavaScript functions that mirror the server-side import functions but appear to be incomplete implementations.

#### `ImportToLedgerDialog.html`
Simple date-range picker for moving transactions from staging to the ledger:
- Two date inputs (from/to)
- Calls `importToTransactions()` on submission

#### `ReviewSidebar.html`
Sidebar for reviewing and categorizing uncategorized transactions:
- Displays transaction details in a table
- Dropdown for category selection
- Checkbox to create categorization rules
- Apply button for each row

#### `SpendingInsightsDialog.html`
Period selection dialog for generating spending insights:
- Options: Last Month, Year-to-Date, Trailing 12 Months
- Triggers insight generation

#### `SpendingInsightsSidebar.html`
Rich visualization sidebar for spending analytics:
- Narrative summary section
- Google Charts integration for visual representation
- Detailed metrics table with comparisons

### Configuration

#### `.clasp.json`
CLASP (Command Line Apps Script) configuration:
- Script ID for deployment
- File extension mappings
- Push/pull settings

## Setup Instructions

1. **Prerequisites**:
   - Google Account with Google Sheets access
   - Node.js and npm installed
   - CLASP CLI tool: `npm install -g @google/clasp`

2. **Clone and Deploy**:
   ```bash
   git clone [repository-url]
   cd "Personal Capital"
   clasp login
   clasp push
   ```

3. **Spreadsheet Setup**:
   - Create sheets named "STG_Transactions" and "Transactions"
   - Ensure both sheets have matching column headers:
     - Date | Vendor | Amount | Category | Source

## Usage

1. **Import Bank Data**:
   - Menu → Personal Capital → Import [Bank] CSV
   - Select CSV file(s)
   - Data imports to STG_Transactions sheet

2. **Review & Categorize**:
   - Review imported transactions in staging
   - Use the Review Sidebar for bulk categorization

3. **Move to Ledger**:
   - Menu → Personal Capital → Import Staging → Transactions
   - Select date range (or leave blank for all)
   - Click Import

4. **Generate Insights**:
   - Menu → Personal Capital → Generate Spending Insights
   - Select analysis period
   - View charts and metrics

## Future Enhancements

### High Priority
1. **Complete CSV Import Functions**:
   - Implement actual CSV parsing and data insertion
   - Add duplicate detection
   - Proper column mapping for each bank format

2. **Auto-Categorization Engine**:
   - Implement `autoCategorize()` function
   - Rule-based pattern matching
   - Machine learning suggestions

3. **Data Validation**:
   - Amount parsing and validation
   - Date format standardization
   - Currency handling

### Medium Priority
4. **Enhanced Analytics**:
   - Budget tracking and alerts
   - Savings rate calculation
   - Cash flow forecasting
   - Category trends over time

5. **Import Improvements**:
   - Support more bank formats
   - Bulk file import UI
   - Import history tracking
   - Undo/rollback functionality

6. **Category Management**:
   - Custom category creation
   - Category hierarchy/subcategories
   - Bulk recategorization tools
   - Category spending limits

### Low Priority
7. **User Experience**:
   - Dark mode support
   - Mobile-responsive dialogs
   - Keyboard shortcuts
   - Progress indicators for long operations

8. **Data Export**:
   - Export to various formats (PDF, Excel, CSV)
   - Scheduled report generation
   - Email summaries

9. **Integration Features**:
   - Google Drive backup
   - Calendar integration for bills
   - Mobile app companion
   - API for third-party tools

10. **Advanced Features**:
    - Multi-currency support
    - Investment tracking
    - Tax report generation
    - Financial goal tracking

## Technical Debt

1. **Missing Functions**:
   - `logImportStats()` - Referenced but not implemented
   - `autoCategorize()` - Referenced but not implemented
   - `applySidebarCategory()` - Referenced in ReviewSidebar.html
   - `generateSpendingInsights()` - Referenced but not implemented

2. **Code Quality**:
   - Consolidate duplicate dialog launcher functions
   - Add proper error handling and logging
   - Implement unit tests
   - Add JSDoc documentation

3. **Performance**:
   - Batch operations for large datasets
   - Optimize sheet operations
   - Implement caching where appropriate

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style patterns
- New features include documentation
- Changes are tested in a Google Sheets environment
- Use `clasp push` to deploy changes

## License

[Add appropriate license information]

## Support

[Add contact/support information] 