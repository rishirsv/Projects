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
export function sanitizeTitle(title: string): string {
  if (!title) return '';
  
  return title
    // Remove/replace invalid filesystem characters
    .replace(/[<>:"/\\|?*]/g, '-')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing spaces and dots
    .trim()
    .replace(/^\.+|\.+$/g, '')
    // Limit length to prevent filesystem issues
    .substring(0, 100)
    .trim();
}

/**
 * Generate transcript filename with title-based naming
 */
export function generateTranscriptFilename(title: string, timestamp: string): string {
  const sanitizedTitle = sanitizeTitle(title);
  return `${sanitizedTitle}-transcript-${timestamp}.txt`;
}

/**
 * Generate summary filename with title-based naming
 */
export function generateSummaryFilename(title: string, timestamp: string): string {
  const sanitizedTitle = sanitizeTitle(title);
  return `${sanitizedTitle}-summary-${timestamp}.md`;
}