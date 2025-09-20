/**
 * Normalize string content by trimming and collapsing whitespace-only payloads.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeContent(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Determine whether normalized content still contains characters.
 * @param {unknown} value
 * @returns {boolean}
 */
export function hasContent(value) {
  return normalizeContent(value).length > 0;
}

export default {
  hasContent,
  normalizeContent,
};
