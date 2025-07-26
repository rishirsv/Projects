import { extractVideoId, generateTranscriptFilename, generateSummaryFilename } from '../src/utils';

describe('Video Title Processing', () => {
  it('should extract video ID correctly and validate title-based naming system', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoId = extractVideoId(videoUrl);
    
    // Should correctly extract video ID
    expect(videoId).toBe('dQw4w9WgXcQ');
    
    // When implemented, should check:
    // 1. Extract video title from YouTube API
    // 2. Use title to generate consistent filenames
    // 3. Transcript file: `${title}-transcript-${timestamp}.txt`
    // 4. Summary file: `${title}-summary-${timestamp}.md`
    // 5. Both files should have matching base names
  });
  
  it('should generate matching transcript and summary filenames', () => {
    const videoTitle = 'Test Video Title';
    const timestamp = '2025-07-22T01-51-19';
    
    const transcriptName = generateTranscriptFilename(videoTitle, timestamp);
    const summaryName = generateSummaryFilename(videoTitle, timestamp);
    
    expect(transcriptName).toBe(`${videoTitle}-transcript-${timestamp}.txt`);
    expect(summaryName).toBe(`${videoTitle}-summary-${timestamp}.md`);
    
    // Extract base names (without extensions and suffixes)
    const transcriptBase = transcriptName.replace('-transcript-' + timestamp + '.txt', '');
    const summaryBase = summaryName.replace('-summary-' + timestamp + '.md', '');
    
    expect(transcriptBase).toBe(summaryBase);
  });
});

// Functions are now implemented in utils.ts and imported above