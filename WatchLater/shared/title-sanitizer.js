const SMART_PUNCTUATION_REPLACEMENTS = [
  { pattern: /[‘’‚‛‹›]/g, replacement: "'" },
  { pattern: /[“”„‟«»]/g, replacement: '"' },
  { pattern: /[‐‑‒–—―−﹘﹣－]/g, replacement: '-' },
  { pattern: /[…]/g, replacement: '...' },
  { pattern: /[\u00a0\u1680\u2000-\u200b\u202f\u205f\u3000]/g, replacement: ' ' },
];

const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const CONTROL_CHARS_REGEX = /[\u0000-\u001f\u007f]/g;
const NON_ASCII_REGEX = /[^\x00-\x7f]/g;

function replaceSmartPunctuation(value) {
  let result = value;
  for (const { pattern, replacement } of SMART_PUNCTUATION_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Sanitize free-form video titles for filesystem-safe usage.
 * @param {string | null | undefined} rawTitle
 * @returns {string}
 */
export function sanitizeTitle(rawTitle) {
  if (!rawTitle) {
    return '';
  }

  let value = String(rawTitle);

  if (typeof value.normalize === 'function') {
    value = value.normalize('NFKD');
  }

  value = replaceSmartPunctuation(value);
  value = value.replace(COMBINING_MARKS_REGEX, '');
  value = value.replace(CONTROL_CHARS_REGEX, ' ');
  value = value.replace(/[\u00a0\u1680\u2000-\u200b\u202f\u205f\u3000]/g, ' ');
  value = value.replace(NON_ASCII_REGEX, '');

  return value
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 100)
    .trim();
}

export default {
  sanitizeTitle,
};
