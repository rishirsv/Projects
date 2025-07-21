# PRD – Autocategorize Transactions on Import
*Filename: `/tasks/prd-autocategorize-transactions.md`*

---

## 1. Introduction / Overview  
Manual tagging of every new bank‐statement CSV costs users 15-30 minutes each month and delays the accuracy of all downstream dashboards. This feature adds an **automatic rule-based categorizer** that assigns a category (and confidence score) to each transaction as it is imported, while allowing one-click corrections that can spawn new rules. The aim is to reach "import → insights" in seconds.

---

## 2. Goals  
1. **Accuracy:** ≥ 90 % of imported transactions match the user's final category in a one-month sample.  
2. **Speed:** Process 2 000-row CSVs within ≤ 2 s after upload.  
3. **Transparency:** Every auto-tag shows the rule ID or confidence score used.  
4. **Maintainability:** All rules live in-sheet (`SYS_CatRules`) so non-coders can edit them; no code changes needed for new vendors.  

---

## 3. User Stories  
| ID | Story | Acceptance |
|----|-------|------------|
| U1 | *As a budget-conscious user, I want each imported transaction automatically categorized so that my spend-by-category charts are accurate without extra work.* | ≥ 90 % of rows show the correct category without manual edits. |
| U2 | *As a user, I want to see how confident the system is for each assigned category, so I know which ones to review first.* | Each row gets a confidence ("High / Medium / Low"); low scores are highlighted. |
| U3 | *As a user, I want to override an incorrect category with one click and optionally create a rule, so future imports improve.* | Sidebar "Save as rule" checkbox appears when user edits a category. |

---

## 4. Functional Requirements  

| # | Requirement |
|---|-------------|
| **FR-1** | The system **must** load regex rules from the hidden sheet `SYS_CatRules` (columns: Pattern, Category, Priority, MinAmt, MaxAmt, Type). |
| **FR-2** | Rules **must** be cached per import run and evaluated in ascending Priority. |
| **FR-3** | A rule **matches** when its regex matches `Vendor`, the transaction type matches (`Debit`/`Credit`/`Any`), and `Amount` falls within optional Min/Max bounds. |
| **FR-4** | When multiple rules match, the first (lowest Priority) wins. |
| **FR-5** | If no rule matches, the category is left blank (`Uncategorized`) with confidence "Low". |
| **FR-6** | Each imported row is appended to `SH_STG` with fields: `Date, Vendor, Amount, Category, SourceBank, RuleID, Confidence`. |
| **FR-7** | Processing time for 2 000 rows must be ≤ 2 s on average. |
| **FR-8** | The Review sidebar **must** allow inline edits to Category. When "Make this a rule" is checked, a new row is appended to `SYS_CatRules` with default Priority = 200. |
| **FR-9** | Editing or adding a rule **must** flush the in-memory rule cache so the next import uses the latest rules. |
| **FR-10** | A monthly cron job exports `SYS_CatRules` to Drive as `CatRules-YYYY-MM-DD.csv` for backup. |

---

## 5. Non-Goals (Out of Scope)  
* No live banking-API integrations—CSV import only.  
* No machine-learning classifier in v1; rule engine first.  
* No mobile-specific UI changes in v1.

---

## 6. Design Considerations (UI/UX)  
* Re-use existing Category column with the same Data-Validation list and color coding.  
* Confidence values surface as a muted chip ("High, Medium, Low").  
* The Review sidebar lists uncategorized / low-confidence rows first, with a "✓ Save as rule" toggle.  

---

## 7. Technical Considerations  
* Import logic already chunks writes; regex evaluation across ~600 rules × 3 000 rows must finish in Apps Script's 30 s limit—test with `Utilities.getCpuTime()`.  
* `SYS_CatRules` must be created if missing (`ensureSheets()`).  
* Use `PropertiesService` to store `_RULE_CACHE` and invalidate on edit.  
* Transaction type (`Debit`/`Credit`) derived from sign of `Amount` unless explicitly provided.  
* Backup cron job via `Triggers` → time-based daily at 02:00.  

---

## 8. Success Metrics  
1. **Auto-tag accuracy:** manual audits show ≥ 90 % correct category.  
2. **Import latency:** median ≤ 2 s for 2 000 rows.  
3. **User overrides:** ≤ 5 % of rows require manual change after one month (indicates learning).  

---

## 9. Open Questions  
1. Should we pre-seed `SYS_CatRules` from the current CSV list or let users start blank?  
2. What confidence thresholds map to High / Medium / Low? (e.g., rule priority buckets?)  
3. Do we need an "Undo" for accidentally created rules?  
4. Should editing a category *without* "Save as rule" influence any ML fallback in v2?

---

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

- [x] 3.0 Integrate Auto-Categorization as Manual Menu Option
  - [x] 3.1 Add "Auto-Categorize Staging Transactions" menu item to Personal Capital menu.
  - [x] 3.2 Implement `runAutoCategorization()` function to process all transactions in staging sheet.
  - [x] 3.3 Update staging sheet schema to include `RuleID` and `Confidence` columns (completed in ensureSheets).
  - [x] 3.4 Create batch processing function to handle large numbers of staging transactions efficiently.
  - [x] 3.5 Add progress feedback and error handling for bulk categorization operations.
  - [x] 3.6 Implement `showAutoCategorizeDialog()` to launch categorization with progress indicator. 