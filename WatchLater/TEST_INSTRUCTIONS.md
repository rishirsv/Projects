# YouTube Transcript API Test Instructions

## Setup
1. Add your Gemini API key to `.env`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Testing the Transcript Fetch

### Good Test URLs (likely to have transcripts):
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Roll - classic test video)
- https://youtu.be/dQw4w9WgXcQ (Short URL format)
- https://www.youtube.com/watch?v=9bZkp7q19f0 (PSY - Gangnam Style)

### What to test:
1. **URL Parsing**: Enter different YouTube URL formats
2. **Transcript Fetch**: Click "Test Transcript Fetch" 
3. **Storage**: Check console and localStorage for saved data
4. **Download**: Click "Download Transcript" to save file locally
5. **Error Handling**: Try invalid URLs or videos without transcripts

### Expected Results:
- Valid URLs should extract video IDs correctly
- Transcripts should display in the preview area
- Files should download with format: `{videoId}-transcript-{timestamp}.txt`
- Data should persist in localStorage with key: `transcript-{videoId}`
- Console should show detailed logging

### Error Cases to Test:
- Invalid YouTube URLs
- Videos without available transcripts
- Network connectivity issues
- Malformed URLs

## Browser Storage
Transcripts are saved in:
1. **localStorage**: For persistence across sessions
2. **Downloads folder**: When clicking "Download Transcript"

You can inspect localStorage in DevTools > Application > Local Storage.