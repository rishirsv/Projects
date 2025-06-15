# Substack Scraper Project

This project provides a simple script for downloading posts from any public or private Substack newsletter.

See [SubstackScraperPRD.md](SubstackScraperPRD.md) for the original product requirements.

## Usage

```bash
pip install -r requirements.txt  # optional, installs feedparser and html2text
python scraper.py https://example.substack.com output_directory
```

Add `--pdf` to also generate PDFs (requires `pdfkit` and `wkhtmltopdf`).

Authentication for private newsletters is not yet implemented, but you can
manually add cookies or login logic in `scraper.py` where indicated.
