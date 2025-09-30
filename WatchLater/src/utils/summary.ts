import type { SummaryData } from '../types/summary';

export function composeSummaryDocument(summary: SummaryData): string {
  const lines: string[] = [];
  const trimmedTitle = summary.title.trim();
  const trimmedAuthor = summary.author.trim();
  const trimmedBody = summary.content.trim();

  if (trimmedTitle) {
    lines.push(`# ${trimmedTitle}`);
  }

  if (trimmedAuthor) {
    lines.push(`_by ${trimmedAuthor}_`);
  }

  if (trimmedBody) {
    if (lines.length) {
      lines.push('');
    }
    lines.push(trimmedBody);
  }

  return lines.join('\n\n').replace(/\n{3,}/g, '\n\n');
}

export function extractKeyTakeaways(summaryText: string): string[] {
  const lines = summaryText.split('\n');
  const takeaways: string[] = [];
  let inTakeawaysSection = false;

  for (const line of lines) {
    if (
      line.toLowerCase().includes('key takeaways') ||
      line.toLowerCase().includes('key takeaway') ||
      line.toLowerCase().includes('key points')
    ) {
      inTakeawaysSection = true;
      continue;
    }
    if (
      inTakeawaysSection &&
      (line.trim().startsWith('-') ||
        line.trim().startsWith('•') ||
        /^\d+[.)]/.test(line.trim()))
    ) {
      takeaways.push(line.trim().replace(/^[-•\d.)\s]+/, ''));
    }
    if (inTakeawaysSection && line.trim() === '' && takeaways.length > 0) {
      break;
    }
  }

  return takeaways.slice(0, 4);
}

export function extractHashtags(summaryText: string): string[] {
  const hashtagMatches = summaryText.match(/#[\w-]+/g);
  return hashtagMatches ? hashtagMatches.slice(0, 3) : [];
}

export function formatKilobytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
