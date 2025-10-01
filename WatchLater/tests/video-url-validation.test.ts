import { extractVideoId, isYouTubeUrl } from '../src/utils';

describe('YouTube URL validation', () => {
  const canonicalId = 'dQw4w9WgXcQ';

  const validInputs: Array<[string, string]> = [
    [`https://www.youtube.com/watch?v=${canonicalId}`, canonicalId],
    [`https://youtube.com/watch?v=${canonicalId}&ab_channel=RickAstley`, canonicalId],
    [`http://youtu.be/${canonicalId}?t=42`, canonicalId],
    [`www.youtube.com/watch?v=${canonicalId}`, canonicalId],
    [`https://m.youtube.com/watch?v=${canonicalId}`, canonicalId],
    [`https://www.youtube.com/shorts/${canonicalId}?feature=share`, canonicalId],
    [`https://www.youtube.com/live/${canonicalId}?si=abc123`, canonicalId],
    [`https://www.youtube.com/embed/${canonicalId}?start=15`, canonicalId],
    [`https://www.youtube-nocookie.com/embed/${canonicalId}`, canonicalId],
    [canonicalId, canonicalId]
  ];

  it.each(validInputs)('extracts the video id from %s', (input, id) => {
    expect(extractVideoId(input)).toBe(id);
    expect(isYouTubeUrl(input)).toBe(true);
  });

  const invalidInputs = [
    'https://vimeo.com/123456',
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=tooShort',
    'not a url',
    ''
  ];

  it.each(invalidInputs)('rejects invalid input %s', (input) => {
    expect(extractVideoId(input)).toBeNull();
    expect(isYouTubeUrl(input)).toBe(false);
  });
});
