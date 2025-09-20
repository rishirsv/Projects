import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeTitle } from './shared/title-sanitizer.js';
import { hasContent, normalizeContent } from './shared/content-validation.js';
import { resolveSupadataApiKey } from './shared/config.js';

// Load environment variables from .env file
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required directories exist
const summariesDir = path.join(__dirname, 'exports', 'summaries');
const transcriptsDir = path.join(__dirname, 'exports', 'transcripts');
const promptsDir = path.join(__dirname, 'prompts');

if (!fs.existsSync(summariesDir)) {
  fs.mkdirSync(summariesDir, { recursive: true });
}
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

console.log(`📁 Directories ensured: ${summariesDir}, ${transcriptsDir}`);

const app = express();
const PORT = 3001;

// Resolve Supadata API key configuration once at startup
const {
  apiKey: SUPADATA_API_KEY,
  isConfigured: isSupadataConfigured,
  source: supadataKeySource
} = resolveSupadataApiKey();

if (!isSupadataConfigured) {
  console.warn('⚠️  Supadata API key is not configured. Transcript requests will fail.');
  if (supadataKeySource === 'placeholder') {
    console.warn('   Update SUPADATA_API_KEY in your .env file with a real Supadata key.');
  } else {
    console.warn('   Add SUPADATA_API_KEY to your environment or .env file.');
  }
}

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Transcript server running with Supadata API',
    supadataConfigured: isSupadataConfigured
  });
});

// Video metadata endpoint using YouTube oEmbed API
app.get('/api/video-metadata/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Fetching video metadata for: ${videoId} using YouTube oEmbed API`);
  
  try {
    // Construct YouTube URL from video ID
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Build YouTube oEmbed API request URL
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    
    console.log(`Calling YouTube oEmbed API: ${oembedUrl}`);
    
    // Make request to YouTube oEmbed API
    const response = await fetch(oembedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WatchLater-App/1.0'
      }
    });

    if (!response.ok) {
      console.error(`YouTube oEmbed API error: ${response.status}`);
      
      if (response.status === 404) {
        return res.status(404).json({ error: 'Video not found or not available' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        return res.status(500).json({ error: `oEmbed API error: ${response.status}` });
      }
    }

    const data = await response.json();
    console.log(`YouTube oEmbed response received: ${data.title}`);

    if (!data.title) {
      return res.status(404).json({ error: 'No title found for this video' });
    }

    // Sanitize title for filesystem use
    const sanitizedTitle = sanitizeTitle(data.title);

    // Format response
    res.json({
      success: true,
      videoId,
      title: data.title,
      sanitizedTitle,
      author: data.author_name,
      authorUrl: data.author_url,
      thumbnailUrl: data.thumbnail_url,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height,
      provider: data.provider_name
    });

  } catch (error) {
    console.error('Video metadata fetch error:', error);
    
    if (error.name === 'AbortError') {
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'The metadata request took too long',
        videoId 
      });
    } else if (error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Unable to connect to YouTube oEmbed API',
        videoId 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch video metadata',
        message: error.message,
        videoId 
      });
    }
  }
});

// Transcript endpoint
app.post('/api/transcript', async (req, res) => {
  const { videoId } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  if (!isSupadataConfigured) {
    return res.status(500).json({ error: 'Supadata API key not configured' });
  }

  console.log(`Fetching transcript for video: ${videoId} using Supadata API`);
  
  try {
    // Construct YouTube URL from video ID
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Build Supadata API request URL
    const apiUrl = new URL('https://api.supadata.ai/v1/youtube/transcript');
    apiUrl.searchParams.append('url', youtubeUrl);
    apiUrl.searchParams.append('text', 'true'); // Get plain text format
    
    console.log(`Calling Supadata API: ${apiUrl.toString()}`);
    
    // Make request to Supadata API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supadata API error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return res.status(500).json({ error: 'Invalid Supadata API key' });
      } else if (response.status === 404) {
        return res.status(404).json({ error: 'No transcript found for this video' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'API rate limit exceeded' });
      } else {
        return res.status(500).json({ error: `Supadata API error: ${response.status}` });
      }
    }

    const data = await response.json();
    console.log(`Supadata API response received, content length: ${data.content?.length || 0}`);

    if (!data.content) {
      return res.status(404).json({ error: 'No transcript content found for this video' });
    }

    // Format response to match the existing API contract
    res.json({
      success: true,
      videoId,
      transcript: data.content,
      length: data.content.length,
      language: data.lang || 'unknown',
      availableLanguages: data.availableLangs || []
    });

  } catch (error) {
    console.error('Transcript fetch error:', error);
    
    if (error.name === 'AbortError') {
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'The transcript request took too long',
        videoId 
      });
    } else if (error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Unable to connect to Supadata API',
        videoId 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch transcript',
        message: error.message,
        videoId 
      });
    }
  }
});

// Get prompt template from file
app.get('/api/prompt', (req, res) => {
  try {
    const promptPath = path.join(promptsDir, 'Youtube transcripts.md');
    if (!fs.existsSync(promptPath)) {
      return res.status(404).json({ error: 'Prompt file not found' });
    }
    
    const promptContent = fs.readFileSync(promptPath, 'utf8');
    res.json({ prompt: promptContent });
    console.log('📝 Prompt loaded from file successfully');
    
  } catch (error) {
    console.error('Prompt loading error:', error);
    res.status(500).json({ 
      error: 'Failed to load prompt',
      message: error.message 
    });
  }
});

// Save transcript to file system
app.post('/api/save-transcript', (req, res) => {
  const { videoId, transcript, title } = req.body;
  
  if (!videoId || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Video ID and transcript are required' });
  }

  const normalizedTranscript = normalizeContent(transcript);
  if (!hasContent(normalizedTranscript)) {
    return res.status(422).json({ error: 'Transcript is empty; nothing to save' });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sanitizedTitle = title ? sanitizeTitle(title) : null;
    const baseFilename = sanitizedTitle ? `${videoId}__${sanitizedTitle}` : videoId;

    const filename = `${baseFilename}-transcript-${timestamp}.txt`;
    const filePath = path.join(transcriptsDir, filename);
    
    // Create transcript content with metadata
    const content = `# YouTube Transcript
Video ID: ${videoId}${title ? `
Title: ${title}` : ''}
Extracted: ${new Date().toISOString()}
Length: ${normalizedTranscript.length} characters

---

${normalizedTranscript}`;

    fs.writeFileSync(filePath, content, 'utf8');
    
    res.json({
      success: true,
      filename,
      path: filePath,
      length: normalizedTranscript.length
    });
    
    console.log(`💾 Transcript saved to file: ${filename}`);
    
  } catch (error) {
    console.error('Transcript save error:', error);
    res.status(500).json({ 
      error: 'Failed to save transcript',
      message: error.message 
    });
  }
});

// List all saved transcripts
app.get('/api/transcripts', (req, res) => {
  try {
    const files = fs.readdirSync(transcriptsDir);
    const transcripts = files
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const filePath = path.join(transcriptsDir, file);
        const stats = fs.statSync(filePath);
        const [prefix] = file.split('-transcript-');
        const [videoIdPart, titlePart] = prefix.split('__');
        const videoId = videoIdPart || 'unknown';
        
        return {
          filename: file,
          videoId,
          title: titlePart || null,
          created: stats.ctime,
          modified: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    res.json({ transcripts });
    console.log(`📋 Listed ${transcripts.length} saved transcripts`);
    
  } catch (error) {
    console.error('Transcript listing error:', error);
    res.status(500).json({ 
      error: 'Failed to list transcripts',
      message: error.message 
    });
  }
});

// Read specific transcript file
app.get('/api/transcript-file/:videoId', (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Find the most recent transcript file for this videoId
    const files = fs.readdirSync(transcriptsDir);
    const transcriptFile = files
      .filter(file => file.endsWith('.txt'))
      .filter(file => file.includes('-transcript-'))
      .filter(file => file.startsWith(`${videoId}__`) || file.startsWith(`${videoId}-`))
      .sort()
      .pop(); // Get the most recent
    
    if (!transcriptFile) {
      return res.status(404).json({ error: 'Transcript file not found for this video ID' });
    }
    
    const filePath = path.join(transcriptsDir, transcriptFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract transcript content (skip metadata header)
    const transcriptStart = content.indexOf('---\n\n') + 5;
    const transcript = transcriptStart > 4 ? content.substring(transcriptStart) : content;
    
    res.json({
      videoId,
      filename: transcriptFile,
      transcript,
      length: transcript.length
    });
    
    console.log(`📖 Read transcript file: ${transcriptFile}`);
    
  } catch (error) {
    console.error('Transcript read error:', error);
    res.status(500).json({ 
      error: 'Failed to read transcript',
      message: error.message 
    });
  }
});

// Summarize saved transcript
app.post('/api/summarize/:videoId', (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Read the transcript file
    const files = fs.readdirSync(transcriptsDir);
    const transcriptFile = files
      .filter(file => file.startsWith(`${videoId}-transcript`) && file.endsWith('.txt'))
      .sort()
      .pop();
    
    if (!transcriptFile) {
      return res.status(404).json({ error: 'Transcript file not found for this video ID' });
    }
    
    const transcriptPath = path.join(transcriptsDir, transcriptFile);
    const transcriptContent = fs.readFileSync(transcriptPath, 'utf8');
    
    // Extract just the transcript text
    const transcriptStart = transcriptContent.indexOf('---\n\n') + 5;
    const transcript = transcriptStart > 4 ? transcriptContent.substring(transcriptStart) : transcriptContent;
    
    // For now, return the transcript info - the actual AI summarization will be handled by frontend
    res.json({
      videoId,
      transcriptFile,
      transcript,
      length: transcript.length,
      message: 'Transcript ready for summarization - use frontend generateSummary() function'
    });
    
    console.log(`🎯 Prepared transcript for summarization: ${videoId}`);
    
  } catch (error) {
    console.error('Summarization prep error:', error);
    res.status(500).json({ 
      error: 'Failed to prepare transcript for summarization',
      message: error.message 
    });
  }
});

// Save summary to file system
app.post('/api/save-summary', (req, res) => {
  const { videoId, summary, title } = req.body;
  
  if (!videoId || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Video ID and summary are required' });
  }

  const normalizedSummary = normalizeContent(summary);
  if (!hasContent(normalizedSummary)) {
    return res.status(422).json({ error: 'Summary is empty; nothing to save' });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sanitizedTitle = title ? sanitizeTitle(title) : null;
    const baseFilename = sanitizedTitle ? `${videoId}__${sanitizedTitle}` : videoId;

    const filename = `${baseFilename}-summary-${timestamp}.md`;
    const filePath = path.join(summariesDir, filename);
    
    // Create summary content with metadata
    const content = `# YouTube Video Summary

**Video ID:** ${videoId}  ${title ? `
**Title:** ${title}  ` : ''}
**Generated:** ${new Date().toISOString()}  
**Length:** ${normalizedSummary.length} characters

---

${normalizedSummary}`;

    fs.writeFileSync(filePath, content, 'utf8');
    
    res.json({
      success: true,
      filename,
      path: filePath,
      length: normalizedSummary.length
    });
    
    console.log(`📄 Summary saved to file: ${filename}`);
    
  } catch (error) {
    console.error('Summary save error:', error);
    res.status(500).json({ 
      error: 'Failed to save summary',
      message: error.message 
    });
  }
});

// List all saved summaries
app.get('/api/summaries', (req, res) => {
  try {
    const files = fs.readdirSync(summariesDir);
    const summaries = files
      .filter(file => file.endsWith('.md') && file.includes('-summary-'))
      .map(file => {
        const filePath = path.join(summariesDir, file);
        const stats = fs.statSync(filePath);
        const [prefix] = file.split('-summary-');
        const [videoIdPart, titlePart] = prefix.split('__');
        const videoId = videoIdPart || 'unknown';
        
        return {
          filename: file,
          videoId,
          title: titlePart || null,
          created: stats.ctime,
          modified: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    res.json({ summaries });
    console.log(`📋 Listed ${summaries.length} saved summaries`);
    
  } catch (error) {
    console.error('Summary listing error:', error);
    res.status(500).json({ 
      error: 'Failed to list summaries',
      message: error.message 
    });
  }
});

// Read specific summary file
app.get('/api/summary-file/:videoId', (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Find the most recent summary file for this videoId
    const files = fs.readdirSync(summariesDir);
    const summaryFile = files
      .filter(file => file.endsWith('.md'))
      .filter(file => file.includes('-summary-'))
      .filter(file => file.startsWith(`${videoId}__`) || file.startsWith(`${videoId}-`))
      .sort()
      .pop(); // Get the most recent
    
    if (!summaryFile) {
      return res.status(404).json({ error: 'Summary file not found for this video ID' });
    }
    
    const filePath = path.join(summariesDir, summaryFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract summary content (skip metadata header)
    const summaryStart = content.indexOf('---\n\n') + 5;
    const summary = summaryStart > 4 ? content.substring(summaryStart) : content;
    
    res.json({
      videoId,
      filename: summaryFile,
      summary,
      length: summary.length
    });
    
    console.log(`📖 Read summary file: ${summaryFile}`);
    
  } catch (error) {
    console.error('Summary read error:', error);
    res.status(500).json({ 
      error: 'Failed to read summary',
      message: error.message 
    });
  }
});

// Generate summary and auto-save to file system
app.post('/api/generate-summary/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Read the transcript file
    const files = fs.readdirSync(transcriptsDir);
    const transcriptFile = files
      .filter(file => file.endsWith('.txt'))
      .filter(file => file.includes('-transcript-'))
      .filter(file => file.startsWith(`${videoId}__`) || file.startsWith(`${videoId}-`))
      .sort()
      .pop();
    
    if (!transcriptFile) {
      return res.status(404).json({ error: 'Transcript file not found for this video ID' });
    }
    
    const transcriptPath = path.join(transcriptsDir, transcriptFile);
    const transcriptContent = fs.readFileSync(transcriptPath, 'utf8');
    
    // Extract just the transcript text
    const transcriptStart = transcriptContent.indexOf('---\n\n') + 5;
    const transcript = transcriptStart > 4 ? transcriptContent.substring(transcriptStart) : transcriptContent;
    
    // Load prompt template
    const promptPath = path.join(promptsDir, 'Youtube transcripts.md');
    if (!fs.existsSync(promptPath)) {
      return res.status(404).json({ error: 'Prompt template file not found' });
    }
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');
    const fullPrompt = promptTemplate + '\n\nHere is the transcript to process:\n\n' + transcript;
    
    // For this endpoint, we return the prepared data for frontend to process with Gemini
    // The actual AI call happens in frontend due to API key security
    res.json({
      videoId,
      transcriptFile,
      transcript,
      prompt: fullPrompt,
      length: transcript.length,
      message: 'Ready for AI processing - frontend will handle Gemini API call and auto-save result'
    });
    
    console.log(`🎯 Prepared transcript and prompt for AI summarization: ${videoId}`);
    
  } catch (error) {
    console.error('Summary preparation error:', error);
    res.status(500).json({ 
      error: 'Failed to prepare for summarization',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Transcript server running on http://localhost:${PORT}`);
  console.log(`📡 Using Supadata API for transcript fetching`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Key configured: ${isSupadataConfigured ? 'Yes' : 'No'}`);
});
