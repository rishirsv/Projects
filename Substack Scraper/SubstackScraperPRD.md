# Substack Scraper Tool PRD

## Overview
This document outlines a proposed script that downloads all posts from a given Substack account as Markdown or PDF files. The tool must support authentication for private newsletters.

## Related GitHub Projects
Based on a quick GitHub search, the following repositories offer related functionality:
- **timf34/Substack2Markdown** – downloads free and premium posts and stores them as Markdown, also offers an HTML interface for browsing.【61259b†L3-L7】
- **zxt-tzx/substack-archives-downloader** – Selenium-based CLI tool that downloads subscribed archives as PDFs.【61259b†L6-L7】
- **bytewife/substack_scraper** – retrieves article text content via scraping.【61259b†L7-L8】
- **humblemat810/substack-scrapper** – reverse-engineers Substack to fetch content as of April 2022.【61259b†L8-L9】
- **aaronbrezel/substack_cat_scraper** – scrapes Substack homepage categories.【61259b†L9-L10】
- **nosajio/substack-dl** – downloads all public posts from any newsletter.【f50fe0†L4-L9】

These projects demonstrate common approaches such as using the Substack API (where possible), HTML scraping, and Selenium to simulate browser activity. They also highlight that many features require user authentication.

## Objectives
- Accept a Substack username or newsletter URL and fetch all posts, including paid/private posts when credentials are supplied.
- Export each post to Markdown and optionally convert to PDF.
- Provide a minimal command-line interface for specifying credentials and output directory.
- Handle pagination and archives gracefully to avoid missed posts.
- Respect Substack’s terms of service and implement polite request rates.

## Key Requirements
1. **Authentication**
   - Allow the user to authenticate with email/password or session cookie for the target Substack account. Support two-factor login if possible.
   - Store tokens securely (e.g., environment variables or a `.env` file that is ignored by git).
2. **Content Retrieval**
   - Detect whether the newsletter exposes an official API (some Substack sites provide JSON endpoints). Use the API when available; otherwise fall back to HTML scraping.
   - For private content, the script must send authenticated requests to fetch post bodies, images, and attachments.
3. **Output Formats**
   - Save each article in a folder using the publication date and slug.
   - Markdown output should preserve formatting and optionally include front-matter metadata (title, author, date, tags).
   - PDF export can rely on a headless browser (such as `playwright` or `puppeteer`) to render the post to PDF.
4. **Efficiency**
   - Implement caching to avoid re-downloading posts that already exist locally.
   - Support incremental downloads (only new posts since the last run).
   - Provide basic logging with summary statistics (number of posts downloaded, skipped, etc.).
5. **Privacy & Legal Considerations**
   - Ensure that the script is used only on newsletters you have the right to access.
   - Avoid redistributing downloaded content without permission from the newsletter owner.

## Suggested Technology Stack
- **Python** for its mature ecosystem and libraries such as `requests`, `beautifulsoup4`, and `playwright` (for PDF conversion).
- Use `argparse` for command-line options and `dotenv` or `keyring` for credential storage.
- Optionally offer Docker configuration for easy setup across platforms.

## Open Questions
- Are there Substack API endpoints for accessing paid content in an official manner? Many existing projects rely on scraping due to limited public APIs.
- Which authentication method provides the best trade-off between usability and security (session cookie vs. email/password)?
- Should the script support scheduling (e.g., cron) to keep an archive automatically updated?

## Milestones
1. **Prototype** – Build minimal script that downloads public posts for a given newsletter in Markdown.
2. **Authentication Support** – Add login handling for private posts.
3. **PDF Export** – Integrate headless browser for PDF rendering.
4. **Polish** – Add logging, configuration file, and packaging for distribution.

