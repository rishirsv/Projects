# Glossary

| Term | Definition |
| --- | --- |
| CLASP | Command Line Apps Script tool used to deploy and manage Apps Script projects. |
| Staging Sheet | Temporary landing zone (`STG_Transactions`) for newly imported transactions awaiting review. |
| Ledger | Final repository (`Transactions`) for approved, categorized entries. |
| Rule Engine | Logic that matches vendor patterns and amount ranges to categories. |
| Confidence | Heuristic label indicating rule match strength (`High`, `Medium`, `Low`). |
| Digest | Aggregated CSV output produced by Python scripts (net worth, IBKR performance, etc.). |
| PortfolioAnalyst | Interactive Brokers export format consumed by `process_ibkr_digests.py`. |
| Sidebar | HTML-based panel within Google Sheets used for interactive workflows. |
| Trigger | Apps Script scheduler (time-driven, on-open, on-edit) that executes functions automatically. |
| PropertiesService | Apps Script storage for caching rule configurations and future secrets. |
