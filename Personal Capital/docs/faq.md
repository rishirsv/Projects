# FAQ

> Answers to frequently asked questions about setup, customization, and automation.

## Table of Contents
- [General](#general)
- [Imports](#imports)
- [Categorization](#categorization)
- [Analytics](#analytics)
- [Security](#security)
- [Development](#development)

## General
**Can I use this with other banks?**  
Yes. Add an entry to `BANK_CONFIGS` and implement a matching `import<Bank>CSV` function that maps columns into the standard schema.

**Does this replace budgeting apps like YNAB or Mint?**  
It targets spreadsheet-first workflows where you control the data. It complements, not replaces, third-party tools.

## Imports
**How large can CSV files be?**  
Keep files under ~5 MB to stay within Apps Script execution quotas. Split larger exports by date or statement period.

**Can I import OFX/QFX files?**  
Not yet. Convert to CSV using your bank portal or third-party tools before uploading.

## Categorization
**How do priorities work?**  
Lower numbers run first. Use them to enforce specific matches before generic catch-alls.

**What if a rule should apply to multiple vendors?**  
Use regex alternation: `^(STARBUCKS|TIM HORTONS)`.

## Analytics
**How often should I run the digest scripts?**  
Weekly or monthly is typical. Automate via cron for consistent reporting.

**Can I extend the insights dashboard?**  
Yes. Add new Sheets to serve as data sources and update the sidebar HTML to render additional charts.

## Security
**Where is my data stored?**  
All Apps Script operations happen within your Google account. Python digests write to local disk; sync them securely if sharing.

**How do I prevent accidental edits to system sheets?**  
Hide `SYS_` sheets and protect them with `SetSheetProtection(true)` if necessary.

## Development
**How can I track rule changes?**  
Version-control a snapshot of `SYS_CatRules` (e.g., export to CSV) and reference it in PRs.

**Do you accept contributions?**  
Yes—follow the [Contributing Guide](./contributing.md) and open a PR with validation steps.
