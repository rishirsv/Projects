import { jest } from '@jest/globals';

process.env.SUPADATA_API_KEY = process.env.SUPADATA_API_KEY ?? 'test-supadata-key';

import { requestSupadataTranscript, __supadataTestHelpers } from '../server.js';

const { coerceTranscriptContent } = __supadataTestHelpers;

describe('Supadata transcript helpers', () => {
  it('coerces transcript content from direct string fields', () => {
    const body = 'Example transcript body with multiple sentences inline.';
    const result = coerceTranscriptContent({ content: body, lang: 'en-US' });
    expect(result?.transcript).toBe(body);
    expect(result?.language).toBe('en-US');
  });

  it('coerces transcript content from segment arrays', () => {
    const segments = [
      { text: 'First line of the transcript with detail.' },
      { text: 'Second line continues the narrative for testing.' }
    ];
    const result = coerceTranscriptContent({ segments, availableLanguages: ['en', 'fr'] });
    expect(result?.transcript).toBe(
      'First line of the transcript with detail. Second line continues the narrative for testing.'
    );
    expect(result?.availableLangs).toEqual(['en', 'fr']);
  });

  it('treats plain text responses as transcripts when structureless', () => {
    const plain = 'Plain text transcript response with several descriptive words.';
    const result = coerceTranscriptContent(plain);
    expect(result?.transcript).toBe(plain);
    expect(result?.source).toBe('plain-text');
  });
});

describe('requestSupadataTranscript', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a transcript when Supadata responds with segments', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { text: 'Segment one delivers enough context for parsing.' },
          { text: 'Segment two adds additional descriptive wording.' }
        ],
        lang: 'en',
        available_langs: ['en', 'es']
      }),
      text: async () => ''
    } as unknown as Response);

    const result = await requestSupadataTranscript('abc123', null);
    expect(fetchMock).toHaveBeenCalled();
    expect(result.outcome).toBe('success');
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.language).toBe('en');
    expect(result.metadata?.availableLangs).toEqual(['en', 'es']);
    expect(result.transcript).toBe(
      'Segment one delivers enough context for parsing. Segment two adds additional descriptive wording.'
    );
  });

  it('falls back to raw text when JSON parsing fails', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('invalid json');
      },
      text: async () => 'Recovered transcript from fallback mode.',
    } as unknown as Response);

    const result = await requestSupadataTranscript('with-fallback', null);
    expect(fetchMock).toHaveBeenCalled();
    expect(result.outcome).toBe('success');
    expect(result.transcript).toBe('Recovered transcript from fallback mode.');
  });
});
