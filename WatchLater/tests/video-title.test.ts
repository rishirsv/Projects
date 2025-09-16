import { extractVideoId, generateTranscriptFilename, generateSummaryFilename } from '../src/utils';

describe('Video Title Processing', () => {
  it('should extract video ID correctly and validate title-based naming system', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoId = extractVideoId(videoUrl);
    
    // Should correctly extract video ID
    expect(videoId).toBe('dQw4w9WgXcQ');
    
    // When implemented, should check:
    // 1. Extract video title from YouTube API
    // 2. Prefix filenames with the videoId for lookup stability
    // 3. Transcript file: `${videoId}__${title}-transcript-${timestamp}.txt`
    // 4. Summary file: `${videoId}__${title}-summary-${timestamp}.md`
    // 5. Both files should share the same `${videoId}__${title}` base
  });
  
  it('should generate matching transcript and summary filenames', () => {
    const videoId = 'dQw4w9WgXcQ';
    const videoTitle = 'Test Video Title';
    const timestamp = '2025-07-22T01-51-19';
    const expectedBase = `${videoId}__${videoTitle}`;
    
    const transcriptName = generateTranscriptFilename(videoId, videoTitle, timestamp);
    const summaryName = generateSummaryFilename(videoId, videoTitle, timestamp);
    
    expect(transcriptName).toBe(`${expectedBase}-transcript-${timestamp}.txt`);
    expect(summaryName).toBe(`${expectedBase}-summary-${timestamp}.md`);
    
    const transcriptBase = transcriptName.replace(`-transcript-${timestamp}.txt`, '');
    const summaryBase = summaryName.replace(`-summary-${timestamp}.md`, '');
    
    expect(transcriptBase).toBe(summaryBase);
  });
});

// Functions are now implemented in utils.ts and imported above
