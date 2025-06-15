import argparse
import os
import re
from pathlib import Path
import requests
import feedparser
import html2text


def sanitize_filename(name: str) -> str:
    name = re.sub(r"[^A-Za-z0-9_-]", "_", name)
    return name[:100]


def fetch_rss_feed(base_url: str, session: requests.Session) -> feedparser.FeedParserDict:
    # Substack exposes RSS feed at /feed
    feed_url = base_url.rstrip('/') + '/feed'
    resp = session.get(feed_url)
    resp.raise_for_status()
    return feedparser.parse(resp.text)


def fetch_article(url: str, session: requests.Session) -> str:
    resp = session.get(url)
    resp.raise_for_status()
    return resp.text


def save_markdown(html: str, output_path: Path):
    md = html2text.html2text(html)
    output_path.write_text(md)


def main():
    parser = argparse.ArgumentParser(description="Download Substack posts")
    parser.add_argument("base_url", help="Base URL of the Substack, e.g., https://example.substack.com")
    parser.add_argument("output_dir", help="Directory to store posts")
    parser.add_argument("--pdf", action="store_true", help="Also save as PDF (requires pdfkit and wkhtmltopdf)")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    # Placeholder for authentication (e.g., session cookies or login) if needed

    feed = fetch_rss_feed(args.base_url, session)
    for entry in feed.entries:
        article_html = fetch_article(entry.link, session)
        title_slug = sanitize_filename(entry.title)
        md_path = output_dir / f"{title_slug}.md"
        save_markdown(article_html, md_path)
        print(f"Saved {md_path}")
        if args.pdf:
            try:
                import pdfkit
                pdf_path = output_dir / f"{title_slug}.pdf"
                pdfkit.from_string(article_html, str(pdf_path))
                print(f"Saved {pdf_path}")
            except Exception as e:
                print(f"PDF generation failed for {entry.link}: {e}")


if __name__ == "__main__":
    main()
