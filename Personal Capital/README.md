# Personal Capital Expense Tracker

> Automate multi-bank CSV imports, rule-based categorization, and financial insights inside Google Sheets with Google Apps Script and Python digests.

## Table of Contents
- [✨ Key Benefits](#-key-benefits)
- [🚀 Quick Start](#-quick-start)
- [📋 Prerequisites](#-prerequisites)
- [🎯 Target Audience](#-target-audience)
- [🛠️ Technology Stack](#-technology-stack)
- [💡 Use Cases](#-use-cases)
- [📈 Success Stories](#-success-stories)
- [📚 Documentation](#-documentation)

## ✨ Key Benefits
- Drag-and-drop CSV import workflow with automatic bank format detection.
- Rule engine for consistent categorization, confidence scoring, and audit trails.
- Integrated staging → ledger pipeline with date filtering and rollbacks.
- Rich Google Sheets UI extensions (dialogs, sidebars, charts) tailored for finance teams.
- Python utilities that convert portfolio exports into analytics-ready digests.

## 🚀 Quick Start
1. **Install CLASP**: `npm install -g @google/clasp`
2. **Clone**: `git clone <repo> && cd "Personal Capital"`
3. **Authenticate**: `clasp login`
4. **Deploy**: `clasp push`
5. **Configure Sheets**: Create a Google Sheet with `STG_Transactions`, `Transactions`, `SYS_ImportLog`, and `SYS_CatRules` tabs.
6. **Run**: Use the `Personal Capital` menu → `Import CSV(s)…` to upload your first bank file.

> ✅ See the [Installation Guide](./docs/installation.md) and [Usage Guide](./docs/usage-guide.md) for full setup and workflows.

## 📋 Prerequisites
- Google Workspace or personal Google account with Sheets access.
- CLASP CLI (`@google/clasp`) and Node.js 18+ for deployment.
- Access to bank CSV exports (AMEX, CIBC, Simplii out-of-the-box).
- Optional: Python 3.10+ and `pip` for running digest scripts.

## 🎯 Target Audience
- Individuals and families managing multi-account finances in Google Sheets.
- Financial coaches consolidating client transactions into a single ledger.
- Quant-minded professionals seeking granular spending analytics without SaaS lock-in.
- Developers extending Apps Script solutions with Python-based reporting.

## 🛠️ Technology Stack
- Google Apps Script (V8 runtime) for menu actions, sheet automation, and HTML dialogs.
- HTML/CSS/JavaScript for modal dialogs and sidebars (file uploads, insights dashboards).
- Python (pandas, numpy, scipy) for net-worth and IBKR digest generation.
- Google Sheets as the primary data store with staging, ledger, rules, and log sheets.

## 💡 Use Cases
- **Household Budgeting**: Import CSVs weekly, auto-categorize recurring merchants, and review exceptions in the sidebar.
- **Side Hustle Tracking**: Separate personal vs. business categories with rule priorities and confidence scoring.
- **Portfolio Insights**: Transform IBKR exports into digest CSVs for net worth, allocations, and cash flow.
- **Client Reviews**: Present curated spending dashboards using the Spending Insights sidebar.

## 📈 Success Stories
- A couple consolidates AMEX and CIBC statements monthly, using rule confidences to focus only on ambiguous expenses.
- A consultant blends Simplii CSVs with Python cash-flow digests to produce quarterly tax-ready reports.
- A financial coach shares templated Sheets and scripts with clients, reducing onboarding time from hours to minutes.

## Documentation
- [Installation Guide](./docs/installation.md)
- [Usage Guide](./docs/usage-guide.md)
- [Configuration Reference](./docs/configuration.md)
- [API & Integration Guide](./docs/api-reference.md)
- [Architecture & Design](./docs/architecture.md)
- [Examples](./docs/examples/basic-examples.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Contributing](./docs/contributing.md)
- [Changelog](./docs/changelog.md)
- [FAQ](./docs/faq.md)
- [Glossary](./docs/glossary.md)
