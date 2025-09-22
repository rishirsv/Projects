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

/**
 * Resolve the OpenRouter API key from environment variables.
 *
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {{ apiKey: string; isConfigured: boolean; source: 'missing' | 'placeholder' | 'env'; }}
 */
export function resolveOpenRouterApiKey(env = process.env) {
  if (!env || typeof env !== 'object') {
    return { apiKey: '', isConfigured: false, source: 'missing' };
  }

  const rawValue = env.OPENROUTER_API_KEY;
  if (typeof rawValue !== 'string') {
    return { apiKey: '', isConfigured: false, source: 'missing' };
  }

  const normalizedValue = rawValue.trim().replace(/^['"]|['"]$/g, '');
  if (!normalizedValue) {
    return { apiKey: '', isConfigured: false, source: 'placeholder' };
  }

  return { apiKey: normalizedValue, isConfigured: true, source: 'env' };
}

/**
 * Resolve the OpenRouter referer header from environment or fallback to localhost.
 *
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {string}
 */
export function resolveOpenRouterReferer(env = process.env) {
  if (!env || typeof env !== 'object') {
    return 'http://localhost:5173';
  }

  const value = env.OPENROUTER_APP_URL;
  if (typeof value !== 'string') {
    return 'http://localhost:5173';
  }

  const normalizedValue = value.trim();
  return normalizedValue || 'http://localhost:5173';
}
