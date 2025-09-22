import { renderSummaryMarkdown } from '../server/markdown-to-html.js';

describe('renderSummaryMarkdown', () => {
  it('renders rich markdown elements into styled HTML', () => {
    const markdown = `## Section Title\n\n- Item one\n- Item two with a [link](https://example.com)\n\n> Insightful quote\n\n\`\`\`js\nconsole.log('hi');\n\`\`\`\n`;

    const html = renderSummaryMarkdown(markdown, {
      title: 'Composable Systems',
      videoId: 'abc123',
      generatedAt: '2024-08-01T12:00:00Z',
      summaryLength: 4200
    });

    expect(html).toContain('<h2>Section Title</h2>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('console.log(');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Composable Systems — WatchLater Summary');
    expect(html).toContain('abc123');
    expect(html).toContain('4.2k characters');
  });

  it('throws when provided markdown is empty', () => {
    expect(() => renderSummaryMarkdown('   ')).toThrow('No markdown content provided for PDF rendering');
  });
});
