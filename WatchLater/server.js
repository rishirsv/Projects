import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { sanitizeTitle } from './shared/title-sanitizer.js';
import { hasContent, normalizeContent } from './shared/content-validation.js';
import { renderSummaryMarkdown } from './server/markdown-to-html.js';
import { renderPdfBuffer, shutdownPdfRenderer } from './server/pdf-renderer.js';
import {
  resolveOpenRouterApiKey,
  resolveOpenRouterReferer,
  resolveSupadataApiKey
} from './shared/config.js';

// Load environment variables from .env file
dotenv.config();

// Get current directory for ES modules
const serverDirectory = process.cwd();

// Ensure required directories exist
const summariesDir = path.join(serverDirectory, 'exports', 'summaries');
const transcriptsDir = path.join(serverDirectory, 'exports', 'transcripts');
const promptsDir = path.join(serverDirectory, 'prompts');
const resolvedSummariesDir = path.resolve(summariesDir);
const resolvedTranscriptsDir = path.resolve(transcriptsDir);
const fsp = fs.promises;

const SUMMARY_MARKER = '\n\n---\n\n';
const VALID_VIDEO_ID = /^[A-Za-z0-9_-]+$/;

function isValidVideoId(candidate) {
  return VALID_VIDEO_ID.test(candidate);
}

function resolveSummaryPath(filename) {
  const resolvedPath = path.resolve(summariesDir, filename);
  if (!resolvedPath.startsWith(resolvedSummariesDir)) {
    throw new Error('Resolved summary path escapes summaries directory');
  }
  return resolvedPath;
}

function resolveTranscriptPath(filename) {
  const resolvedPath = path.resolve(transcriptsDir, filename);
  if (!resolvedPath.startsWith(resolvedTranscriptsDir)) {
    throw new Error('Resolved transcript path escapes transcripts directory');
  }
  return resolvedPath;
}

function findSummaryFiles(videoId) {
  const allFiles = fs.readdirSync(summariesDir);
  return allFiles
    .filter(file => file.endsWith('.md'))
    .filter(file => file.includes('-summary-'))
    .filter(file => file.startsWith(`${videoId}__`) || file.startsWith(`${videoId}-`));
}

function getLatestSummaryFile(videoId) {
  const files = findSummaryFiles(videoId);
  if (!files.length) {
    return null;
  }

  return files
    .map(file => {
      const filePath = resolveSummaryPath(file);
      const stats = fs.statSync(filePath);
      return { file, modified: stats.mtime.getTime() };
    })
    .sort((a, b) => b.modified - a.modified)[0].file;
}

function extractMetadataValue(section, label) {
  if (!section) return '';
  const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`);
  const match = section.match(regex);
  if (!match) return '';
  return match[1].replace(/\s{2,}$/, '').trim();
}

function fallbackTitleFromFilename(filename) {
  const base = filename.split('-summary-')[0];
  const [, rawTitle] = base.split('__');
  if (!rawTitle) {
    return '';
  }
  return rawTitle.replace(/[-_]+/g, ' ').trim();
}

function parseSummaryFileContent(fileContent, filename, videoId) {
  const markerIndex = fileContent.indexOf(SUMMARY_MARKER);
  const metadataSection = markerIndex >= 0 ? fileContent.slice(0, markerIndex) : '';
  const summaryMarkdown = markerIndex >= 0 ? fileContent.slice(markerIndex + SUMMARY_MARKER.length) : fileContent;

  const metadata = {
    videoId,
    title: extractMetadataValue(metadataSection, 'Title') || fallbackTitleFromFilename(filename) || `Video ${videoId}`,
    author: extractMetadataValue(metadataSection, 'Author') || '',
    generatedAt: extractMetadataValue(metadataSection, 'Generated'),
    summaryLength: Number.parseInt(extractMetadataValue(metadataSection, 'Length'), 10) || summaryMarkdown.length
  };

  return {
    summaryMarkdown,
    metadata
  };
}

function derivePdfFilename(sourceFilename) {
  return sourceFilename.replace(/\.md$/, '.pdf');
}

if (!fs.existsSync(summariesDir)) {
  fs.mkdirSync(summariesDir, { recursive: true });
}
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

console.log(`📁 Directories ensured: ${summariesDir}, ${transcriptsDir}`);

export const app = express();
const PORT = 3001;

// Resolve Supadata API key configuration once at startup
const {
  apiKey: SUPADATA_API_KEY,
  isConfigured: isSupadataConfigured,
  source: supadataKeySource
} = resolveSupadataApiKey();

const {
  apiKey: OPENROUTER_API_KEY,
  isConfigured: isOpenRouterConfigured,
  source: openRouterKeySource
} = resolveOpenRouterApiKey();
const openRouterReferer = resolveOpenRouterReferer();
const OPENROUTER_APP_TITLE = process.env.OPENROUTER_APP_TITLE?.trim() || 'WatchLater Summaries';

if (!isSupadataConfigured) {
  console.warn('⚠️  Supadata API key is not configured. Transcript requests will fail.');
  if (supadataKeySource === 'placeholder') {
    console.warn('   Update SUPADATA_API_KEY in your .env file with a real Supadata key.');
  } else {
    console.warn('   Add SUPADATA_API_KEY to your environment or .env file.');
  }
}

if (!isOpenRouterConfigured) {
  console.warn('⚠️  OpenRouter API key is not configured. OpenRouter models will be unavailable.');
  if (openRouterKeySource === 'placeholder') {
    console.warn('   Update OPENROUTER_API_KEY in your environment with a valid key.');
  }
}

const SUPADATA_TRANSCRIPT_ENDPOINT = 'https://api.supadata.ai/v1/youtube/transcript';
const SUPADATA_RETRYABLE_STATUSES = new Set([500, 502, 503, 504, 429]);
const SUPADATA_MAX_RETRIES = 3;
const SUPADATA_RETRY_DELAYS_MS = [250, 750, 1500];
const PREFERRED_TRANSCRIPT_LANGS = ['en', 'en-US', 'en-GB', 'en-CA'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseAvailableLanguages = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const candidates = ['availableLangs', 'available_langs', 'availableLanguages'];
  for (const field of candidates) {
    const value = payload[field];
    if (!value) {
      continue;
    }
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry;
          }
          if (entry && typeof entry === 'object') {
            return entry.lang || entry.code || entry.language || null;
          }
          return null;
        })
        .filter((lang) => typeof lang === 'string' && lang.length > 0);
    }
  }
  return [];
};

const extractSegmentText = (segment) => {
  if (!segment) {
    return null;
  }
  if (typeof segment === 'string') {
    return segment;
  }
  if (typeof segment !== 'object') {
    return null;
  }
  const textKeys = ['text', 'content', 'caption', 'body', 'segment'];
  for (const key of textKeys) {
    const value = segment[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const joinSegments = (value) => {
  if (!Array.isArray(value)) {
    return null;
  }
  const parts = [];
  for (const segment of value) {
    const text = extractSegmentText(segment);
    if (typeof text === 'string') {
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
    }
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
};

const looksLikeTranscriptText = (candidate) => {
  if (typeof candidate !== 'string') {
    return false;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return false;
  }
  if (/^\s*[\[{]/.test(trimmed)) {
    return false;
  }
  if (/<\/?(html|body|!doctype)/i.test(trimmed)) {
    return false;
  }
  if (/(error|not found|unavailable)/i.test(trimmed) && trimmed.length < 300) {
    return false;
  }
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  return wordCount >= 5;
};

const coerceTranscriptContent = (payload, visited = new Set()) => {
  if (payload == null) {
    return null;
  }

  if (visited.has(payload)) {
    return null;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) {
      return null;
    }
    if (/^\s*[\[{]/.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        return coerceTranscriptContent(parsed, visited);
      } catch {
        // fall through to plain-text heuristics
      }
    }
    if (looksLikeTranscriptText(trimmed)) {
      return {
        transcript: trimmed,
        source: 'plain-text'
      };
    }
    return null;
  }

  if (Array.isArray(payload)) {
    visited.add(payload);
    const joined = joinSegments(payload);
    if (joined) {
      return {
        transcript: joined,
        source: 'segments'
      };
    }
    for (const entry of payload) {
      const nested = coerceTranscriptContent(entry, visited);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  visited.add(payload);

  const objectPayload = payload;
  const availableLangs = parseAvailableLanguages(objectPayload);
  const languageCandidate =
    typeof objectPayload.lang === 'string'
      ? objectPayload.lang
      : typeof objectPayload.language === 'string'
          ? objectPayload.language
          : typeof objectPayload.detected_lang === 'string'
              ? objectPayload.detected_lang
              : undefined;

  const candidateKeys = ['transcript', 'content', 'text', 'result', 'items', 'segments'];
  for (const key of candidateKeys) {
    const value = objectPayload[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      if (/^\s*[\[{]/.test(trimmed)) {
        const nested = coerceTranscriptContent(trimmed, visited);
        if (nested) {
          return {
            transcript: nested.transcript,
            language: nested.language ?? languageCandidate,
            availableLangs: nested.availableLangs?.length
              ? nested.availableLangs
              : availableLangs,
            source: nested.source ?? key
          };
        }
      }
      if (looksLikeTranscriptText(trimmed)) {
        return {
          transcript: trimmed,
          language: languageCandidate,
          availableLangs,
          source: key
        };
      }
    } else if (Array.isArray(value)) {
      const joined = joinSegments(value);
      if (joined) {
        return {
          transcript: joined,
          language: languageCandidate,
          availableLangs,
          source: key
        };
      }
    } else if (value && typeof value === 'object') {
      const nested = coerceTranscriptContent(value, visited);
      if (nested) {
        return {
          transcript: nested.transcript,
          language: nested.language ?? languageCandidate,
          availableLangs: nested.availableLangs?.length
            ? nested.availableLangs
            : availableLangs,
          source: nested.source ?? key
        };
      }
    }
  }

  const nestedKeys = ['raw', 'data', 'payload', 'response'];
  for (const key of nestedKeys) {
    const nestedCandidate = objectPayload[key];
    if (!nestedCandidate) {
      continue;
    }
    const nested = coerceTranscriptContent(nestedCandidate, visited);
    if (nested) {
      return {
        transcript: nested.transcript,
        language: nested.language ?? languageCandidate,
        availableLangs: nested.availableLangs?.length
          ? nested.availableLangs
          : availableLangs,
        source: nested.source ?? key
      };
    }
  }

  return null;
};

export const requestSupadataTranscript = async (videoId, lang) => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const apiUrl = new URL(SUPADATA_TRANSCRIPT_ENDPOINT);
  apiUrl.searchParams.append('url', youtubeUrl);
  apiUrl.searchParams.append('text', 'true');
  if (lang) {
    apiUrl.searchParams.append('lang', lang);
  }

  for (let attempt = 1; attempt <= SUPADATA_MAX_RETRIES; attempt += 1) {
    try {
      const attemptLabel = `attempt ${attempt} (lang=${lang ?? 'auto'})`;
      console.log(`[supadata] transcript ${attemptLabel} for ${videoId}`);
      const attemptStartedAt = Date.now();
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': SUPADATA_API_KEY,
          Accept: 'application/json'
        }
      });
      const requestDurationMs = Date.now() - attemptStartedAt;

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        data = { error: 'Unable to parse Supadata response', raw: text };
      }

      const availableLangs = parseAvailableLanguages(data);

      const transcriptCandidate = response.ok ? coerceTranscriptContent(data) : null;

      if (response.ok && transcriptCandidate) {
        const combinedLangs = new Set(availableLangs);
        if (Array.isArray(transcriptCandidate.availableLangs)) {
          for (const candidate of transcriptCandidate.availableLangs) {
            if (typeof candidate === 'string' && candidate) {
              combinedLangs.add(candidate);
            }
          }
        }

        const resolvedLanguageSource =
          transcriptCandidate.language || data?.lang || lang || 'unknown';
        const resolvedLanguage =
          typeof resolvedLanguageSource === 'string'
            ? resolvedLanguageSource
            : String(resolvedLanguageSource);

        console.info('[supadata] transcript %s succeeded', attemptLabel, {
          videoId,
          durationMs: requestDurationMs,
          language: resolvedLanguage,
          chars: transcriptCandidate.transcript.length,
          source: transcriptCandidate.source ?? 'content',
          availableLangs: Array.from(combinedLangs)
        });

        return {
          outcome: 'success',
          transcript: transcriptCandidate.transcript,
          metadata: {
            language: resolvedLanguage,
            availableLangs: Array.from(combinedLangs)
          }
        };
      }

      const retryable = SUPADATA_RETRYABLE_STATUSES.has(response.status);
      const baseMessage = data?.error || `Supadata API error: ${response.status}`;

      if (retryable && attempt < SUPADATA_MAX_RETRIES) {
        const delay = SUPADATA_RETRY_DELAYS_MS[Math.min(attempt - 1, SUPADATA_RETRY_DELAYS_MS.length - 1)];
        console.warn(
          `[supadata] retryable error (${response.status}) — retrying after ${delay}ms`,
          {
            videoId,
            durationMs: requestDurationMs,
            message: baseMessage,
            availableLangs
          }
        );
        await wait(delay);
        continue;
      }

      if (response.ok && !data?.content) {
        console.warn('[supadata] transcript response empty', {
          videoId,
          durationMs: requestDurationMs,
          availableLangs,
          message: baseMessage
        });
        return {
          outcome: 'empty',
          status: response.status,
          message: 'Supadata response did not include transcript content.',
          availableLangs
        };
      }

      console.warn('[supadata] transcript request failed', {
        videoId,
        status: response.status,
        durationMs: requestDurationMs,
        message: baseMessage,
        availableLangs
      });

      return {
        outcome: 'error',
        status: response.status,
        message: baseMessage,
        availableLangs
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (attempt >= SUPADATA_MAX_RETRIES) {
        throw error;
      }
      const delay = SUPADATA_RETRY_DELAYS_MS[Math.min(attempt - 1, SUPADATA_RETRY_DELAYS_MS.length - 1)];
      console.warn(
        `[supadata] network error on attempt ${attempt}: ${error instanceof Error ? error.message : error}. Retrying in ${delay}ms.`,
        {
          videoId
        }
      );
      await wait(delay);
    }
  }

  throw new Error('Exhausted Supadata retries without success.');
};

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
    const initialResult = await requestSupadataTranscript(videoId, null);
    const attemptedLanguages = ['auto'];
    const aggregateAvailable = new Set(
      initialResult.outcome === 'success'
        ? initialResult.metadata.availableLangs ?? []
        : initialResult.availableLangs ?? []
    );

    if (initialResult.outcome === 'success') {
      const transcript = initialResult.transcript;
      const language = initialResult.metadata.language;
      const availableLanguages = Array.from(aggregateAvailable);
      return res.json({
        success: true,
        videoId,
        transcript,
        length: transcript.length,
        language,
        availableLanguages
      });
    }

    if (initialResult.outcome === 'error' && initialResult.status === 401) {
      return res.status(500).json({ error: 'Invalid Supadata API key' });
    }

    if (initialResult.outcome === 'error' && initialResult.status === 429) {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        message: initialResult.message,
        videoId
      });
    }

    const pendingLangs = [];

    const enqueueLang = (lang) => {
      if (!lang || lang === 'auto') {
        return;
      }
      aggregateAvailable.add(lang);
      if (!attemptedLanguages.includes(lang) && !pendingLangs.includes(lang)) {
        pendingLangs.push(lang);
      }
    };

    for (const preferred of PREFERRED_TRANSCRIPT_LANGS) {
      enqueueLang(preferred);
    }
    for (const lang of aggregateAvailable) {
      enqueueLang(lang);
    }

    let lastFailure = initialResult;

    while (pendingLangs.length > 0) {
      const lang = pendingLangs.shift();
      if (!lang) {
        continue;
      }

      attemptedLanguages.push(lang);
      const result = await requestSupadataTranscript(videoId, lang);

      if (result.outcome === 'success') {
        const transcript = result.transcript;
        const language = result.metadata.language;
        for (const available of result.metadata.availableLangs ?? []) {
          aggregateAvailable.add(available);
        }
        const availableLanguages = Array.from(aggregateAvailable);
        return res.json({
          success: true,
          videoId,
          transcript,
          length: transcript.length,
          language,
          availableLanguages
        });
      }

      lastFailure = result;
      if (Array.isArray(result.availableLangs)) {
        for (const candidate of result.availableLangs) {
          enqueueLang(candidate);
        }
      }
    }

    const availableLanguages = Array.from(aggregateAvailable);
    const status =
      lastFailure.outcome === 'error' && lastFailure.status
        ? lastFailure.status === 404
          ? 404
          : lastFailure.status === 401
              ? 500
              : lastFailure.status === 429
                  ? 429
                  : lastFailure.status >= 500
                      ? 502
                      : lastFailure.status
        : 404;

    const message =
      lastFailure.outcome === 'empty'
        ? 'Supadata did not return transcript text even after trying fallback languages.'
        : lastFailure.message || 'Supadata transcript request failed.';

    res.status(status).json({
      error:
        lastFailure.outcome === 'empty'
          ? 'No transcript content found for this video'
          : 'Failed to fetch transcript',
      message,
      videoId,
      attemptedLanguages,
      availableLanguages,
      supadataStatus: lastFailure.status ?? null
    });
  } catch (error) {
    console.error('Transcript fetch error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The transcript request took too long',
        videoId
      });
    }

    if (error instanceof Error && error.message.includes('connect')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to connect to Supadata API',
        videoId
      });
    }

    res.status(500).json({
      error: 'Failed to fetch transcript',
      message: error instanceof Error ? error.message : 'Unknown error',
      videoId
    });
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

export const __supadataTestHelpers = {
  coerceTranscriptContent
};

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

const OPENROUTER_PREFIX = 'openrouter/';

function normalizeOpenRouterModelId(modelId) {
  if (typeof modelId !== 'string') {
    return '';
  }
  const trimmed = modelId.trim();
  return trimmed.startsWith(OPENROUTER_PREFIX) ? trimmed.slice(OPENROUTER_PREFIX.length) : trimmed;
}

// Generate summary via OpenRouter proxy
app.post('/api/openrouter/generate', async (req, res) => {
  if (!isOpenRouterConfigured) {
    return res.status(503).json({ error: 'OpenRouter API key not configured' });
  }

  const { modelId, prompt, temperature } = req.body || {};

  if (typeof modelId !== 'string' || !modelId.trim()) {
    return res.status(400).json({ error: 'modelId is required' });
  }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const rawModelId = modelId.trim();
  const apiModelId = normalizeOpenRouterModelId(rawModelId);

  if (!apiModelId) {
    return res.status(400).json({ error: 'modelId is invalid' });
  }

  const normalizedPrompt = normalizeContent(prompt);
  if (!hasContent(normalizedPrompt)) {
    return res.status(400).json({ error: 'Prompt content is empty' });
  }

  const payload = {
    model: apiModelId,
    messages: [
      {
        role: 'user',
        content: normalizedPrompt
      }
    ],
    stream: false
  };

  if (typeof temperature === 'number' && Number.isFinite(temperature)) {
    payload.temperature = temperature;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': openRouterReferer,
        'X-Title': OPENROUTER_APP_TITLE
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `OpenRouter error: ${response.status}`;
      return res.status(response.status).json({ error: errorMessage });
    }

    const summary = data?.choices?.[0]?.message?.content;
    if (!summary || typeof summary !== 'string') {
      return res.status(502).json({ error: 'OpenRouter did not return any summary content' });
    }

    res.json({ summary: summary.trim(), modelId: rawModelId });
    console.log(
      `🧠 OpenRouter summary generated using ${rawModelId}${
        rawModelId !== apiModelId ? ` (normalized to ${apiModelId})` : ''
      }`
    );

  } catch (error) {
    console.error('OpenRouter generate error:', error);
    res.status(500).json({
      error: 'Failed to generate summary via OpenRouter',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save summary to file system
app.post('/api/save-summary', (req, res) => {
  const { videoId, summary, title, modelId, author } = req.body;
  
  if (!videoId || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Video ID and summary are required' });
  }

  const normalizedSummary = normalizeContent(summary);
  const selectedModelId = typeof modelId === 'string' ? modelId.trim() : '';
  if (!hasContent(normalizedSummary)) {
    return res.status(422).json({ error: 'Summary is empty; nothing to save' });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sanitizedTitle = title ? sanitizeTitle(title) : null;
    const creator = typeof author === 'string' ? author.trim() : '';
    const baseFilename = sanitizedTitle ? `${videoId}__${sanitizedTitle}` : videoId;

    const filename = `${baseFilename}-summary-${timestamp}.md`;
    const filePath = path.join(summariesDir, filename);
    
    // Create summary content with metadata
    const generatedAt = new Date().toISOString();
    const metadataLines = [`**Video ID:** ${videoId}`];

    if (title) {
      metadataLines.push(`**Title:** ${title}`);
    }

    if (creator) {
      metadataLines.push(`**Author:** ${creator}`);
    }

    metadataLines.push(`**Generated:** ${generatedAt}`);
    metadataLines.push(`**Length:** ${normalizedSummary.length} characters`);

    if (selectedModelId) {
      metadataLines.push(`**Model:** ${selectedModelId}`);
    }

    const metadataBlock = metadataLines.map(line => `${line}  `).join('\n');

    const content = `# YouTube Video Summary\n\n${metadataBlock}\n\n---\n\n${normalizedSummary}`;

    fs.writeFileSync(filePath, content, 'utf8');
    
    res.json({
      success: true,
      filename,
      path: filePath,
      length: normalizedSummary.length,
      modelId: selectedModelId,
      author: creator || undefined
    });
    
    if (selectedModelId) {
      console.log(`📄 Summary saved to file: ${filename} (model: ${selectedModelId})`);
    } else {
      console.log(`📄 Summary saved to file: ${filename}`);
    }
    
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
        let author = null;
        let derivedTitle = titlePart ? titlePart.trim() : null;

        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const { metadata } = parseSummaryFileContent(fileContent, file, videoId);
          if (metadata.title) {
            derivedTitle = metadata.title.trim();
          }
          if (metadata.author) {
            author = metadata.author.trim() || null;
          }
        } catch (parseError) {
          console.warn(`Failed to parse metadata for summary ${file}:`, parseError);
        }

        return {
          filename: file,
          videoId,
          title: derivedTitle,
          author,
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
    const metadataSection = summaryStart > 4 ? content.substring(0, summaryStart - 5) : '';
    const modelFromFile = extractMetadataValue(metadataSection, 'Model') || null;
    const authorFromFile = extractMetadataValue(metadataSection, 'Author') || '';

    res.json({
      videoId,
      filename: summaryFile,
      summary,
      length: summary.length,
      modelId: modelFromFile,
      author: authorFromFile ? authorFromFile.trim() : null
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

// Generate PDF for the most recent summary
export async function getSummaryPdf(req, res) {
  const { videoId } = req.params;

  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).json({ error: 'Valid video ID is required for PDF export' });
  }

  try {
    const summaryFile = getLatestSummaryFile(videoId);

    if (!summaryFile) {
      return res.status(404).json({ error: 'Summary file not found for this video ID' });
    }

    const summaryPath = resolveSummaryPath(summaryFile);
    const start = Date.now();
    console.log(`🖨️  Starting PDF export for ${videoId} using ${summaryFile}`);
    const fileContent = fs.readFileSync(summaryPath, 'utf8');
    const { summaryMarkdown, metadata } = parseSummaryFileContent(fileContent, summaryFile, videoId);

    const html = renderSummaryMarkdown(summaryMarkdown, metadata);
    const pdfBuffer = await renderPdfBuffer(html, { videoId, jobId: `summary-${videoId}` });
    const downloadFilename = derivePdfFilename(summaryFile);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.send(pdfBuffer);

    console.log(`🖨️  Generated PDF for summary: ${summaryFile} (${Date.now() - start}ms)`);
  } catch (error) {
    console.error('Summary PDF export error:', error);

    if (error.code === 'PDF_RENDER_TIMEOUT') {
      return res.status(503).json({
        error: 'PDF rendering timed out',
        message: error.message,
        videoId
      });
    }

    res.status(500).json({
      error: 'Failed to generate summary PDF',
      message: error.message,
      videoId
    });
  }
}

app.get('/api/summary/:videoId/pdf', getSummaryPdf);

export async function deleteAllSummaries(req, res) {
  const includeTranscripts = String(req.query.includeTranscripts).toLowerCase() === 'true';

  try {
    const summaryFiles = (await fsp.readdir(summariesDir)).filter(file => file.endsWith('.md'));
    const transcriptFiles = includeTranscripts
      ? (await fsp.readdir(transcriptsDir)).filter(file => file.endsWith('.txt'))
      : [];

    let deletedSummaries = 0;
    const deletedSummaryFiles = [];
    for (const file of summaryFiles) {
      const filePath = resolveSummaryPath(file);
      try {
        await fsp.unlink(filePath);
        deletedSummaries += 1;
        deletedSummaryFiles.push(file);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    let deletedTranscripts = 0;
    const deletedTranscriptFiles = [];
    if (includeTranscripts) {
      for (const file of transcriptFiles) {
        const filePath = resolveTranscriptPath(file);
        try {
          await fsp.unlink(filePath);
          deletedTranscripts += 1;
          deletedTranscriptFiles.push(file);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
    }

    console.log('🗑️  Cleared saved exports', {
      includeTranscripts,
      deletedSummaries,
      deletedTranscripts
    });

    res.json({
      deletedSummaries,
      deletedTranscripts,
      deletedSummaryFiles,
      deletedTranscriptFiles
    });
  } catch (error) {
    console.error('Summary deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete summaries',
      message: error.message
    });
  }
}

export async function deleteSummaryByVideoId(req, res) {
  const { videoId } = req.params;
  const deleteAll = String(req.query.all).toLowerCase() === 'true';

  if (!videoId || !isValidVideoId(videoId)) {
    return res.status(400).json({ error: 'Valid video ID is required for deletion' });
  }

  try {
    const matchingFiles = findSummaryFiles(videoId);
    if (!matchingFiles.length) {
      return res.status(404).json({ error: 'No summary files found for this video ID' });
    }

    const filesToDelete = deleteAll ? matchingFiles : [getLatestSummaryFile(videoId)].filter(Boolean);
    const deletedFiles = [];

    for (const file of filesToDelete) {
      const filePath = resolveSummaryPath(file);
      try {
        await fsp.unlink(filePath);
        deletedFiles.push(file);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    console.log('🗑️  Deleted summary files', {
      videoId,
      count: deletedFiles.length,
      deleteAll
    });

    res.json({
      deletedCount: deletedFiles.length,
      deletedFiles,
      deleteAll
    });
  } catch (error) {
    console.error('Summary delete error:', error);
    res.status(500).json({
      error: 'Failed to delete summary files',
      message: error.message
    });
  }
}

app.delete('/api/summaries', deleteAllSummaries);
app.delete('/api/summary/:videoId', deleteSummaryByVideoId);

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Transcript server running on http://localhost:${PORT}`);
    console.log(`📡 Using Supadata API for transcript fetching`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Key configured: ${isSupadataConfigured ? 'Yes' : 'No'}`);
  });

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
      console.log(`🛑 Received ${signal}, shutting down PDF renderer`);
      await shutdownPdfRenderer().catch(() => {});
      process.exit(0);
    });
  });
}

export default app;
