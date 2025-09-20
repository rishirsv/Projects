import { hasContent, normalizeContent } from '../shared/content-validation.js';

function ensureContent(value: unknown, label: string): string {
  const normalized = normalizeContent(value);
  if (!hasContent(normalized)) {
    throw new Error(`${label} is empty; nothing to save.`);
  }
  return normalized;
}

describe('content validation guard', () => {
  it('detects blank strings as empty content', () => {
    expect(hasContent('   ')).toBe(false);
    expect(hasContent('\n')).toBe(false);
  });

  it('normalizes unicode whitespace before validation', () => {
    const nonBreakingSpace = '\u00a0';
    expect(hasContent(`${nonBreakingSpace}${nonBreakingSpace}`)).toBe(false);
    expect(normalizeContent(`${nonBreakingSpace}Hello`)).toBe('Hello');
  });

  it('throws when ensureContent receives empty payloads', () => {
    expect(() => ensureContent('   ', 'Transcript')).toThrow('Transcript is empty; nothing to save.');
  });

  it('returns trimmed content when payload is valid', () => {
    expect(ensureContent('  Hello world  ', 'Summary')).toBe('Hello world');
  });
});
