import { resolveSummaryPdfFilename } from '../src/utils';

describe('resolveSummaryPdfFilename', () => {
  it('uses sanitized title to build a friendly filename', () => {
    const filename = resolveSummaryPdfFilename('gO0bvT_smdM', 'How to Change Your Life!!!');
    expect(filename).toBe('How to Change Your Life!!! - Summary.pdf');
  });

  it('strips trailing punctuation replacements from sanitized titles', () => {
    const filename = resolveSummaryPdfFilename('gO0bvT_smdM', 'Ends with colon:');
    expect(filename).toBe('Ends with colon - Summary.pdf');
  });

  it('falls back to server suggestion when title is omitted', () => {
    const filename = resolveSummaryPdfFilename('gO0bvT_smdM', undefined, 'video__title-summary-123.pdf');
    expect(filename).toBe('video__title-summary-123.pdf');
  });

  it('falls back to video ID when title sanitizes to empty content', () => {
    const filename = resolveSummaryPdfFilename('gO0bvT_smdM', '💖💖');
    expect(filename).toBe('gO0bvT_smdM - Summary.pdf');
  });

  it('ignores server suggestion when an explicit but empty title is provided', () => {
    const filename = resolveSummaryPdfFilename('gO0bvT_smdM', '', 'video__title-summary-123.pdf');
    expect(filename).toBe('gO0bvT_smdM - Summary.pdf');
  });
});
