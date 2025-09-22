# Contributing

> How to set up a development environment, follow coding standards, and submit high-quality changes.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Code Organization](#code-organization)
- [Apps Script Workflow](#apps-script-workflow)
- [Python Workflow](#python-workflow)
- [Testing](#testing)
- [Documentation Standards](#documentation-standards)
- [Pull Request Checklist](#pull-request-checklist)
- [Issue Reporting](#issue-reporting)
- [Code of Conduct](#code-of-conduct)

## Environment Setup
- Install Node.js 18+, Python 3.10+, and CLASP.
- Run `npm install` if you add local tooling (linting, bundlers).
- Use `.env` or CLASP `settings.json` to store deployment details without committing secrets.

## Code Organization
| Path | Description |
| --- | --- |
| `Code.js` | Core Apps Script logic |
| `ImportDialog.html` | CSV upload UI |
| `ImportToLedgerDialog.html` | Date filter dialog |
| `docs/` | Documentation, onboarding, analytics references |
| `examples/personal-capital/` | Automation scripts |
| `process_*.py` | Python data transformation utilities |

## Apps Script Workflow
- Use `clasp pull` before editing to avoid overwriting collaborators’ changes.
- Run scripts in a test spreadsheet before pushing to production.
- Keep functions short and descriptive; add inline comments only for non-obvious logic.
- Log significant operations with `Logger.log` for easier debugging.

## Python Workflow
- Format code with `black` or `ruff` for consistent style.
- Add table-driven tests using `pytest` if functions become more complex.
- Parameterize file paths and allow CLI overrides to support automation.

## Testing
- Manual tests: import sample CSVs for each bank, run auto-categorization, move rows to ledger.
- Add spreadsheet formulas or Google Apps Script unit tests (`QUnitGS2`) as the project grows.
- For Python, run `python -m pytest` or script-level smoke tests before committing.

## Documentation Standards
- Update `README.md`, `docs/usage-guide.md`, and `docs/configuration.md` when adding new features or banks.
- Document manual verification steps in `docs/` alongside affected scripts (per repository guidelines).
- Include screenshots in `assets/screenshots/` for UX changes.

## Pull Request Checklist
- [ ] Changes tested in a sandbox Google Sheet.
- [ ] Python scripts executed successfully (`python3 process_net_worth.py`).
- [ ] Documentation updated and cross-referenced.
- [ ] No secrets or personal data committed.
- [ ] PR description includes validation steps and screenshots (if UI changed).

## Issue Reporting
- Include sheet type (personal/workspace), browser, and error messages.
- Attach sanitized sample CSVs when reporting import bugs.
- Provide snapshot of `SYS_CatRules` relevant rows for categorization issues.

## Code of Conduct
- Be respectful and constructive in discussions.
- Assume unfamiliarity; document decisions and welcome newcomers.
- Follow Google’s acceptable use policies when handling financial data.
