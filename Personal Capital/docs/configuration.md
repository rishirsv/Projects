# Configuration Reference

> Detailed specification for sheets, columns, rule syntax, environment variables, and logging options.

## Table of Contents
- [Sheet Structure](#sheet-structure)
- [Column Definitions](#column-definitions)
- [Categorization Rules](#categorization-rules)
- [Import Settings](#import-settings)
- [Environment Variables & Properties](#environment-variables--properties)
- [Logging](#logging)
- [Security Considerations](#security-considerations)

## Sheet Structure
| Sheet | Required | Purpose |
| --- | --- | --- |
| `STG_Transactions` | Yes | Raw imports awaiting review; includes categorization metadata |
| `Transactions` | Yes | Final ledger used for analytics and reporting |
| `SYS_ImportLog` | Optional (auto-created) | Stores timestamped import statistics |
| `SYS_CatRules` | Optional (auto-created) | Houses categorization rules |
| `InsightsPivot` | Optional | Staging area for chart data (if extending insights) |

> ✅ `ensureSheets()` creates missing sheets with bold headers on first run.

## Column Definitions
### `STG_Transactions`
| Column | Type | Description |
| --- | --- | --- |
| Date | Date | Parsed transaction date |
| Vendor | Text | Merchant or memo field |
| Amount | Number | Negative for spending, positive for income |
| Category | Text | Assigned category (blank until categorized) |
| Source | Text | Bank identifier (AMEX, CIBC, SIMPLII) |
| RuleID | Text | Identifier of matched rule (e.g., `SYS-12`) |
| Confidence | Text | `High`, `Medium`, `Low` heuristic |

### `Transactions`
| Column | Type | Description |
| --- | --- | --- |
| Date | Date | Finalized transaction date |
| Vendor | Text | Merchant name |
| Amount | Number | Normalized amount |
| Category | Text | Ledger category |
| Source | Text | Originating bank or script |

### `SYS_CatRules`
| Column | Description |
| --- | --- |
| Pattern | Case-insensitive regex applied to vendor field |
| Category | Destination category |
| Priority | Numeric sort order (lower runs first) |
| MinAmt / MaxAmt | Optional bounds (inclusive) |
| Type | Optional label (`expense`, `income`, etc.) |
| Notes | Free-form notes for maintainers |

## Categorization Rules
- Patterns use JavaScript RegExp syntax; escape special characters as needed.
- Assign unique priorities (1, 2, 3…). Ties are resolved in order of appearance.
- Rule caching persists for one hour; clear by editing rules or calling `PropertiesService.deleteProperty('CATEGORY_RULES_CACHE')` in the console.
- Confidence scores derive from match source: regex-only matches are `Medium`, those with amount bounds or type hints escalate to `High`.

## Import Settings
- Bank autodetection leverages `BANK_CONFIGS` in `Code.js`.
  | Bank | Detection | Special Notes |
  | --- | --- | --- |
  | AMEX | Header regex (`date.*description.*amount`) | Debits stored as negative; script inverts positives |
  | CIBC | No header; numeric first column | Debit and credit columns merged into net amount |
  | SIMPLII | Header containing `Funds Out` | Similar handling to CIBC |
- All parsers normalize numbers by stripping currency symbols and parentheses.
- To extend support for new banks, add entries to `BANK_CONFIGS` and create corresponding import functions.

## Environment Variables & Properties
- Apps Script `PropertiesService.getDocumentProperties()` caches compiled rules.
- For upcoming integrations, store API keys using `PropertiesService.getScriptProperties()` instead of literals.
- Python scripts can read environment variables (e.g., `OUTPUT_DIR`, `INPUT_FILE`) to run in CI/CD; extend scripts with `argparse` as needed.

## Logging
- `logImportStats(bank, rowsRead, rowsKept, rowsSkipped)` appends rows to `SYS_ImportLog`.
- Use `Logger.log()` liberally during development; view logs via Apps Script execution transcripts.
- Add Google Analytics or Stackdriver logging if scaling to team-sized deployments.

## Security Considerations
- **Sheet Permissions**: Share Sheets with view/comment access for collaborators; restrict edit access to trusted users.
- **Rule Management**: Hide `SYS_` sheets to prevent accidental edits; they are auto-created as hidden tabs.
- **CSV Handling**: Validate CSV sources and scan for malicious formulas before importing into Sheets.
- **Python Data**: Store digests outside of synced folders if they contain sensitive net-worth data.
