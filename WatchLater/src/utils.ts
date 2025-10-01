import { sanitizeTitle as sharedSanitizeTitle } from '../shared/title-sanitizer.js';

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const sanitizeVideoId = (candidate: string | null | undefined): string | null => {
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();
  return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : null;
};

const normalizeHostname = (hostname: string): string => {
  return hostname.replace(/^www\./i, '').replace(/^m\./i, '').toLowerCase();
};

const decodeSegment = (segment: string | undefined): string | null => {
  if (!segment) {
    return null;
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const coerceUrl = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z+.-]*:\/\//.test(trimmed);
  const prefixed = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;

  const candidate = hasScheme ? prefixed : `https://${prefixed}`;

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
};

/**
 * Extract YouTube video ID from various URL formats (watch, embed, shorts, live, share).
 */
export function extractVideoId(input: string): string | null {
  const directId = sanitizeVideoId(input);
  if (directId) {
    return directId;
  }

  const url = coerceUrl(input);
  if (!url) {
    return null;
  }

  const normalizedHost = normalizeHostname(url.hostname);

  if (normalizedHost === 'youtu.be') {
    const [firstSegment] = url.pathname.split('/').filter(Boolean);
    return sanitizeVideoId(decodeSegment(firstSegment));
  }

  if (normalizedHost === 'youtube-nocookie.com') {
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'embed') {
      return sanitizeVideoId(decodeSegment(segments[1]));
    }
    return null;
  }

  if (normalizedHost.endsWith('youtube.com')) {
    const segments = url.pathname.split('/').filter(Boolean).map((segment) => decodeSegment(segment) ?? '');

    if (segments.length === 0 || segments[0] === 'watch') {
      return sanitizeVideoId(url.searchParams.get('v'));
    }

    if (['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
      return sanitizeVideoId(segments[1]);
    }

    if (segments[0] === 'playlist') {
      return sanitizeVideoId(url.searchParams.get('v'));
    }
  }

  return null;
}

/**
 * Determine if the provided string contains a recognizable YouTube link or ID.
 */
export function isYouTubeUrl(input: string): boolean {
  return extractVideoId(input) !== null;
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
export function generateSummaryFilename(
  videoId: string,
  title: string | null,
  _timestamp?: string,
  author?: string | null
): string {
  const sanitizedTitle = sanitizeTitle(title || `video-${videoId}`) || `video-${videoId}`;
  const sanitizedAuthor = author ? sanitizeTitle(author) : '';
  const tokens = [sanitizedTitle];
  if (sanitizedAuthor) {
    tokens.push(sanitizedAuthor);
  }
  tokens.push('summary', videoId);
  if (_timestamp) {
    tokens.push(_timestamp);
  }
  return `${tokens.join('-')}.md`;
}

/**
 * Resolve a human-friendly PDF filename for a summary download.
 */
export function resolveSummaryPdfFilename(
  videoId: string,
  title: string | null | undefined,
  suggestedName?: string | null
): string {
  const hasExplicitTitle = title !== undefined;
  const sanitizedTitle = title ? sanitizeTitle(title) : '';
  const normalizedTitle = sanitizedTitle
    .replace(/[-\s]+$/g, '')
    .replace(/^[-\s]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (normalizedTitle) {
    return `${normalizedTitle} - Summary.pdf`;
  }

  if (hasExplicitTitle) {
    return `${videoId} - Summary.pdf`;
  }

  if (suggestedName && suggestedName.trim()) {
    return suggestedName.trim();
  }

  return `${videoId} - Summary.pdf`;
}
