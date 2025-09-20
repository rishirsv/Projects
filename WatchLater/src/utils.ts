import { sanitizeTitle as sharedSanitizeTitle } from '../shared/title-sanitizer.js';

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Sanitize video title for filesystem use
 */
export function sanitizeTitle(title: string | null | undefined): string {
  return sharedSanitizeTitle(title ?? '');
}

/**
 * Generate transcript filename with title-based naming
 */
export function generateTranscriptFilename(videoId: string, title: string | null, timestamp: string): string {
  const sanitizedTitle = title ? sanitizeTitle(title) : '';
  const baseFilename = sanitizedTitle ? `${videoId}__${sanitizedTitle}` : videoId;
  return `${baseFilename}-transcript-${timestamp}.txt`;
}

/**
 * Generate summary filename with title-based naming
 */
export function generateSummaryFilename(videoId: string, title: string | null, timestamp: string): string {
  const sanitizedTitle = title ? sanitizeTitle(title) : '';
  const baseFilename = sanitizedTitle ? `${videoId}__${sanitizedTitle}` : videoId;
  return `${baseFilename}-summary-${timestamp}.md`;
}
