import { resolveSupadataApiKey } from '../shared/config.js';

describe('resolveSupadataApiKey', () => {
  it('returns not configured when SUPADATA_API_KEY is missing', () => {
    const result = resolveSupadataApiKey({});
    expect(result.isConfigured).toBe(false);
    expect(result.apiKey).toBe('');
    expect(result.source).toBe('missing');
  });

  it('strips whitespace and surrounding quotes from the key', () => {
    const result = resolveSupadataApiKey({ SUPADATA_API_KEY: '  "abc123"  ' });
    expect(result.isConfigured).toBe(true);
    expect(result.apiKey).toBe('abc123');
  });

  it('flags placeholder values as not configured', () => {
    const placeholderValues = [
      'your-api-key-here',
      'your_supadata_api_key_here',
      'YOUR_SUPADATA_API_KEY_HERE'
    ];

    for (const value of placeholderValues) {
      const result = resolveSupadataApiKey({ SUPADATA_API_KEY: value });
      expect(result.isConfigured).toBe(false);
      expect(result.apiKey).toBe('');
      expect(result.source).toBe('placeholder');
    }
  });
});
