/**
 * Resolve the Supadata API key from the provided environment map.
 * Strips quotes/whitespace and flags placeholder values so callers
 * can warn the user before attempting a real API request.
 *
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {{ apiKey: string; isConfigured: boolean; source: 'missing' | 'placeholder' | 'env'; }}
 */
export function resolveSupadataApiKey(env = process.env) {
  if (!env || typeof env !== 'object') {
    return { apiKey: '', isConfigured: false, source: 'missing' };
  }

  const rawValue = env.SUPADATA_API_KEY;
  if (typeof rawValue !== 'string') {
    return { apiKey: '', isConfigured: false, source: 'missing' };
  }

  // Trim whitespace and surrounding quotes that appear in some shell exports
  const normalizedValue = rawValue.trim().replace(/^['"]|['"]$/g, '');

  const placeholders = new Set([
    '',
    'your-api-key-here',
    'your_supadata_api_key_here',
    'YOUR_SUPADATA_API_KEY_HERE'
  ]);

  if (placeholders.has(normalizedValue)) {
    return { apiKey: '', isConfigured: false, source: 'placeholder' };
  }

  return { apiKey: normalizedValue, isConfigured: true, source: 'env' };
}
