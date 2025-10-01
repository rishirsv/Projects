import { extractVideoId, sanitizeTitle, generateTranscriptFilename, generateSummaryFilename } from '../src/utils';

describe('Video Title Processing', () => {
  it('should extract video ID correctly and validate title-based naming system', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoId = extractVideoId(videoUrl);
    
    // Should correctly extract video ID
    expect(videoId).toBe('dQw4w9WgXcQ');
    
    // When implemented, should check:
    // 1. Extract video title from YouTube API
    // 2. Transcript file: `${videoId}__${title}-transcript-${timestamp}.txt`
    // 3. Summary file: `${title}-${author?}-summary-${videoId}.md`
    // 4. Both files remain traceable via the embedded videoId
  });
  
  it('should generate matching transcript and summary filenames', () => {
    const videoId = 'dQw4w9WgXcQ';
    const videoTitle = 'Test Video Title';
    const timestamp = '2025-07-22T01-51-19';
    const expectedBase = `${videoId}__${videoTitle}`;
    
    const transcriptName = generateTranscriptFilename(videoId, videoTitle, timestamp);
    const summaryName = generateSummaryFilename(videoId, videoTitle, timestamp, 'Creator Name');

    expect(transcriptName).toBe(`${expectedBase}-transcript-${timestamp}.txt`);
    expect(summaryName).toBe(`Test Video Title-Creator Name-summary-${videoId}-${timestamp}.md`);
  });

  it('converts smart punctuation and diacritics to ASCII-safe filename components', () => {
    const videoId = 'abcd1234xyz';
    const videoTitle = 'Branson’s Private Island — São Tomé reveal';
    const timestamp = '2025-07-22T01-51-19';

    const sanitized = sanitizeTitle(videoTitle);
    expect(sanitized).toBe("Branson's Private Island - Sao Tome reveal");

    const summaryName = generateSummaryFilename(videoId, videoTitle, timestamp, 'Creator');
    expect(summaryName).toBe("Branson's Private Island - Sao Tome reveal-Creator-summary-abcd1234xyz-2025-07-22T01-51-19.md");
  });

  it('maps mixed smart quotes and dashes consistently for transcripts and summaries', () => {
    const videoId = 'efgh5678ijk';
    const title = '“Inside” the World – Beyoncé’s Renaissance Tour';
    const timestamp = '2025-08-01T10-15-30';

    const transcriptName = generateTranscriptFilename(videoId, title, timestamp);
    const summaryName = generateSummaryFilename(videoId, title, timestamp);

    expect(transcriptName).toBe("efgh5678ijk__-Inside- the World - Beyonce's Renaissance Tour-transcript-2025-08-01T10-15-30.txt");
    expect(summaryName).toBe("-Inside- the World - Beyonce's Renaissance Tour-summary-efgh5678ijk-2025-08-01T10-15-30.md");
  });
});

// Functions are now implemented in utils.ts and imported above
