import MarkdownIt from 'markdown-it';
import { hasContent, normalizeContent } from '../shared/content-validation.js';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false
});

const BASE_STYLES = `
  :root {
    color-scheme: light dark;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    background-color: #ffffff;
    color: #1f1f28;
  }

  body {
    margin: 0;
    padding: 0;
    background: var(--pdf-background, #ffffff);
    color: var(--pdf-foreground, #1f1f28);
  }

  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 48px 56px;
    line-height: 1.6;
    font-size: 14px;
  }

  header {
    background: linear-gradient(135deg, #7f5bff, #46e0b1);
    color: #ffffff;
    padding: 36px 48px;
  }

  header h1 {
    font-size: 26px;
    margin: 0 0 12px;
    font-weight: 600;
  }

  header p {
    margin: 6px 0;
    font-size: 14px;
    opacity: 0.95;
  }

  .header-subtitle {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    opacity: 0.9;
  }

  a {
    color: #3c55f3;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  h1, h2, h3, h4, h5, h6 {
    color: inherit;
    margin: 32px 0 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  h1 { font-size: 28px; }
  h2 { font-size: 22px; }
  h3 { font-size: 18px; }
  h4 { font-size: 16px; }
  h5 { font-size: 14px; }
  h6 { font-size: 13px; }

  p {
    margin: 16px 0;
  }

  ul, ol {
    margin: 16px 0 16px 24px;
    padding: 0;
  }

  li {
    margin: 8px 0;
  }

  blockquote {
    margin: 24px 0;
    padding: 16px 20px;
    border-left: 4px solid #7f5bff;
    background: rgba(127, 91, 255, 0.08);
    border-radius: 12px;
  }

  blockquote p:last-child {
    margin-bottom: 0;
  }

  pre {
    background: #0f1a2e;
    color: #f4f6ff;
    padding: 16px 20px;
    border-radius: 12px;
    overflow: auto;
    font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    line-height: 1.45;
    margin: 24px 0;
  }

  code {
    font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-size: 13px;
  }

  th, td {
    border: 1px solid rgba(127, 91, 255, 0.25);
    padding: 10px 12px;
    text-align: left;
  }

  th {
    background: rgba(127, 91, 255, 0.12);
    font-weight: 600;
  }

  hr {
    height: 1px;
    border: 0;
    background: rgba(13, 20, 36, 0.1);
    margin: 32px 0;
  }

  nav.breadcrumbs {
    display: flex;
    gap: 16px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 16px;
    opacity: 0.75;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 20px;
  }

  .meta-item {
    font-size: 13px;
    opacity: 0.95;
  }

  .meta-item span {
    display: block;
    font-weight: 600;
    opacity: 0.85;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }

  .callout {
    padding: 16px 20px;
    border-radius: 12px;
    margin: 20px 0;
    border: 1px solid rgba(70, 224, 177, 0.35);
    background: rgba(70, 224, 177, 0.1);
  }

  .callout strong {
    display: block;
    margin-bottom: 4px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      background-color: #0d1320;
      color: #eef1ff;
    }

    main {
      color: #eef1ff;
    }

    header {
      color: rgba(255, 255, 255, 0.95);
    }

    blockquote {
      background: rgba(127, 91, 255, 0.18);
      border-color: rgba(127, 91, 255, 0.7);
    }

    pre {
      background: rgba(4, 8, 18, 0.9);
      color: #f4f6ff;
    }

    th, td {
      border-color: rgba(70, 224, 177, 0.3);
    }

    th {
      background: rgba(70, 224, 177, 0.15);
    }
  }

  @media print {
    body {
      background: #ffffff !important;
      color: #1f1f28 !important;
    }

    header {
      color: #ffffff !important;
    }

    a {
      color: #1f47d7;
    }

    main {
      padding: 32px 40px 48px;
    }
  }
`;

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function describeLength(length) {
  if (!Number.isFinite(length)) return '';
  if (length < 1000) return `${length} characters`;
  const kilobytes = Math.round(length / 100) / 10;
  return `${kilobytes.toFixed(1)}k characters`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Convert saved summary markdown into printable HTML with styling.
 * @param {string} markdownContent
 * @param {{
 *  title?: string,
 *  videoId?: string,
 *  generatedAt?: string,
 *  wordCount?: number,
 *  summaryLength?: number,
 *  author?: string
 * }} [metadata]
 * @returns {string}
 */
export function renderSummaryMarkdown(markdownContent, metadata = {}) {
  const normalizedMarkdown = normalizeContent(markdownContent);
  if (!hasContent(normalizedMarkdown)) {
    throw new Error('No markdown content provided for PDF rendering');
  }

  const rendered = markdown.render(normalizedMarkdown);
  const {
    title = 'Video Summary',
    videoId = 'unknown',
    generatedAt = '',
    summaryLength,
    author = ''
  } = metadata;

  const formattedTimestamp = formatTimestamp(generatedAt);
  const lengthLabel = describeLength(summaryLength ?? normalizedMarkdown.length);

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)} — WatchLater Summary</title>
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <header>
        <nav class="breadcrumbs">
          <span>WatchLater</span>
          <span>Summaries</span>
          <span>PDF Export</span>
        </nav>
        <h1>${escapeHtml(title)}</h1>
        ${author ? `<p class="header-subtitle">By ${escapeHtml(author)}</p>` : ''}
        <div class="meta-grid">
          <div class="meta-item">
            <span>Video ID</span>
            ${escapeHtml(videoId)}
          </div>
          ${formattedTimestamp ? `<div class="meta-item"><span>Generated</span>${escapeHtml(formattedTimestamp)}</div>` : ''}
          ${lengthLabel ? `<div class="meta-item"><span>Summary Length</span>${escapeHtml(lengthLabel)}</div>` : ''}
        </div>
      </header>
      <main>
        ${rendered}
      </main>
    </body>
  </html>`;
}

export default {
  renderSummaryMarkdown
};
