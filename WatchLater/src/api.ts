import { GoogleGenerativeAI } from '@google/generative-ai';
import { hasContent, normalizeContent } from '../shared/content-validation.js';
import { resolveRuntimeEnv } from '../shared/env';
import { extractVideoId, resolveSummaryPdfFilename } from './utils';

type RequestConfig = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const PROMPT_TIMEOUT_MS = 10_000;
const METADATA_TIMEOUT_MS = 15_000;
const TRANSCRIPT_TIMEOUT_MS = 180_000;
const SAVE_TRANSCRIPT_TIMEOUT_MS = 60_000;
const SUMMARY_SAVE_TIMEOUT_MS = 45_000;
const OPENROUTER_TIMEOUT_MS = 120_000;
const SUMMARY_PDF_TIMEOUT_MS = 60_000;
const DELETE_TIMEOUT_MS = 30_000;

const createAbortError = (message: string) => {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal }: RequestConfig = {}
): Promise<Response> => {
  const controller = new AbortController();
  const abortReason = createAbortError(`Request aborted after ${timeoutMs}ms`);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const handleExternalAbort = () => {
    controller.abort(signal?.reason ?? createAbortError('Request aborted'));
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason ?? createAbortError('Request aborted'));
    } else {
      signal.addEventListener('abort', handleExternalAbort);
    }
  }

  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(abortReason);
    }, timeoutMs);
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason instanceof Error) {
        throw reason;
      }
      throw createAbortError(typeof reason === 'string' ? reason : 'Request aborted');
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (signal && !signal.aborted) {
      signal.removeEventListener('abort', handleExternalAbort);
    }
  }
};

const throwIfAborted = (signal?: AbortSignal) => {
  if (!signal) {
    return;
  }
  const reason = signal.reason;
  if (signal.aborted) {
    throw reason instanceof Error
      ? reason
      : createAbortError(typeof reason === 'string' ? reason : 'Request aborted');
  }
};

const settleWithSignal = async <T,>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) {
    return promise;
  }

  throwIfAborted(signal);

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => {
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : createAbortError(typeof signal.reason === 'string' ? signal.reason : 'Request aborted')
      );
    };

    signal.addEventListener('abort', handleAbort);

    promise
      .then((value) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(value);
      })
      .catch((error) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      });
  });
};

// Backend server URL
const SERVER_URL = 'http://localhost:3001';

function extractFilenameFromDisposition(header?: string | null): string {
  if (!header) return '';

  const filenameStarMatch = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].replace(/"/g, '').trim());
    } catch {
      return filenameStarMatch[1].replace(/"/g, '').trim();
    }
  }

  const filenameMatch = header.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1].trim();
  }

  return '';
}

async function parsePdfError(response: Response): Promise<string> {
  try {
    const data = await response.clone().json();
    return data.message || data.error || `Server error: ${response.status}`;
  } catch {
    return `Server error: ${response.status}`;
  }
}

/**
 * Fetch prompt template from backend
 */
async function fetchPromptTemplate(config: RequestConfig = {}): Promise<string> {
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/prompt`,
      undefined,
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? PROMPT_TIMEOUT_MS
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch prompt template');
    }
    
    return data.prompt + '\n\nHere is the transcript to process:\n\n';
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    // Fallback to hardcoded prompt if file loading fails
    return `# Role
You are an expert educational content processor that converts raw YouTube transcripts into structured articles optimized for learning.

# Goal
- Create an article from a provided transcript that promotes comprehension, retention, and practical application.

# Instructions
1. Extract key concepts and create learning objectives
2. Write structured content with clear explanations
3. Include practical applications and self-assessment questions

Here is the transcript to process:

`;
  }
}

/**
 * Fetch video metadata using YouTube oEmbed API via backend
 */
export async function fetchVideoMetadata(
  videoId: string,
  config: RequestConfig = {}
): Promise<{
  success: boolean;
  videoId: string;
  title: string;
  sanitizedTitle: string;
  author: string;
  authorUrl: string;
  thumbnailUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  provider: string;
}> {
  console.log('Fetching video metadata via oEmbed API for video ID:', videoId);
  
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/video-metadata/${videoId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? METADATA_TIMEOUT_MS
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    if (!data.success || !data.title) {
      throw new Error('No video metadata received from server');
    }

    console.log(`Video metadata received: "${data.title}" by ${data.author}`);
    return data;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    // Check if server is running
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to metadata server at ${SERVER_URL}. Make sure to run: npm run server`);
    }
    
    console.error('Video metadata fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch video metadata: ${errorMessage}`);
  }
}

/**
 * Fetch transcript for a YouTube video via local server (using Supadata API)
 */
export async function fetchTranscript(videoId: string, config: RequestConfig = {}): Promise<string> {
  console.log('Fetching transcript via local server (Supadata API) for video ID:', videoId);
  
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/transcript`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      },
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? TRANSCRIPT_TIMEOUT_MS
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const serverMessage =
        (typeof data === 'object' && data && (data.message || data.error)) ||
        `Server error: ${response.status}`;
      const available = Array.isArray(data?.availableLanguages) ? data.availableLanguages : [];
      const suffix = available.length > 0 ? ` Available languages: ${available.join(', ')}.` : '';
      throw new Error(`${serverMessage}${suffix}`);
    }

    if (!data.success || !data.transcript) {
      const serverMessage =
        (typeof data === 'object' && data && (data.message || data.error)) ||
        'No transcript available for this video.';
      const available = Array.isArray(data?.availableLanguages) ? data.availableLanguages : [];
      const suffix = available.length > 0 ? ` Available languages: ${available.join(', ')}.` : '';
      throw new Error(`${serverMessage}${suffix}`);
    }

    console.log(`Transcript received: ${data.length} characters, ${data.items} items`);
    return data.transcript;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    // Check if server is running
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to transcript server at ${SERVER_URL}. Make sure to run: npm run server`);
    }
    
    console.error('Transcript fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch transcript: ${errorMessage}`);
  }
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Generate summary using the selected model/provider.
 */
export async function generateSummary(
  transcript: string,
  modelId: string,
  config: RequestConfig = {}
): Promise<string> {
  throwIfAborted(config.signal);

  const promptTemplate = await fetchPromptTemplate({
    signal: config.signal,
    timeoutMs: config.timeoutMs ?? PROMPT_TIMEOUT_MS
  });
  const prompt = promptTemplate + transcript;
  const trimmedModel = modelId?.trim() || DEFAULT_GEMINI_MODEL;

  if (trimmedModel.startsWith('openrouter/')) {
    return generateSummaryViaOpenRouter(trimmedModel, prompt, {
      signal: config.signal,
      timeoutMs: config.timeoutMs ?? OPENROUTER_TIMEOUT_MS
    });
  }

  return generateSummaryViaGemini(trimmedModel, prompt, config);
}

async function generateSummaryViaGemini(
  modelId: string,
  prompt: string,
  config: RequestConfig = {}
): Promise<string> {
  const runtimeEnv = resolveRuntimeEnv();
  const apiKey = runtimeEnv?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    throwIfAborted(config.signal);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId || DEFAULT_GEMINI_MODEL });

    const result = await settleWithSignal(model.generateContent(prompt), config.signal);
    const response = await settleWithSignal(Promise.resolve(result.response), config.signal);
    return response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateSummaryViaOpenRouter(
  modelId: string,
  prompt: string,
  config: RequestConfig = {}
): Promise<string> {
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/openrouter/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ modelId, prompt })
      },
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? OPENROUTER_TIMEOUT_MS
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate summary via OpenRouter');
    }

    if (!data.summary || typeof data.summary !== 'string') {
      throw new Error('OpenRouter returned an empty response');
    }

    return data.summary;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(`Failed to generate summary via OpenRouter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save transcript to file system and localStorage
 */
export async function saveTranscript(
  videoId: string,
  transcript: string,
  autoDownload = false,
  title?: string,
  config: RequestConfig = {}
): Promise<void> {
  if (!hasContent(transcript)) {
    throw new Error('No transcript available to save. Supadata did not return any text.');
  }

  const normalizedTranscript = normalizeContent(transcript);

  try {
    // Save to backend file system
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/save-transcript`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, transcript: normalizedTranscript, title })
      },
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? SAVE_TRANSCRIPT_TIMEOUT_MS
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save transcript to file system');
    }

    console.log(`💾 Transcript saved to file system: ${data.filename}`);

    // Also handle browser download if requested
    if (autoDownload) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${videoId}-transcript-${timestamp}.txt`;
      
      const content = `# YouTube Transcript
Video ID: ${videoId}
Extracted: ${new Date().toISOString()}
Length: ${normalizedTranscript.length} characters

---

${normalizedTranscript}`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }

    // Also store in localStorage for offline access
    const storageKey = `transcript-${videoId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      videoId,
      transcript: normalizedTranscript,
      timestamp: new Date().toISOString(),
      length: normalizedTranscript.length,
      savedToFile: true,
      filename: data.filename
    }));

    console.log(`📱 Transcript also saved to localStorage with key: ${storageKey}`);

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error saving transcript:', error);
    
    // Fallback to localStorage only if file system save fails
    const storageKey = `transcript-${videoId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      videoId,
      transcript,
      timestamp: new Date().toISOString(),
      length: transcript.length,
      savedToFile: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
    
    console.log(`⚠️ Fallback: Transcript saved to localStorage only`);
    throw error;
  }
}

/**
 * Get all stored transcripts from localStorage
 */
export function getStoredTranscripts(): Array<{ videoId: string; timestamp: string; length: number }> {
  const transcripts = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('transcript-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        transcripts.push({
          videoId: data.videoId,
          timestamp: data.timestamp,
          length: data.length
        });
      } catch (error) {
        console.warn(`Failed to parse stored transcript for key: ${key}`, error);
      }
    }
  }
  
  return transcripts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get all saved transcripts from file system
 */
export async function getSavedTranscripts(
  config: RequestConfig = {}
): Promise<Array<{ filename: string; videoId: string; created: string; modified: string; size: number }>> {
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/transcripts`,
      undefined,
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get saved transcripts');
    }
    
    return data.transcripts;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error getting saved transcripts:', error);
    throw new Error(`Failed to get saved transcripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read specific transcript file from file system
 */
export async function readSavedTranscript(
  videoId: string,
  config: RequestConfig = {}
): Promise<{ videoId: string; filename: string; transcript: string; length: number }> {
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/transcript-file/${videoId}`,
      undefined,
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to read saved transcript');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error reading saved transcript:', error);
    throw new Error(`Failed to read saved transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate summary from saved transcript file and auto-save to server
 */
export async function generateSummaryFromFile(
  videoId: string,
  modelId: string,
  config: RequestConfig = {}
): Promise<{ summary: string; savedFile: { filename: string; path: string }; modelId: string }> {
  try {
    throwIfAborted(config.signal);
    // First, read the transcript from file
    const transcriptData = await readSavedTranscript(videoId, config);
    
    // Try to fetch video metadata for title
    let title = undefined;
    let author = undefined;
    try {
      const metadata = await fetchVideoMetadata(videoId, config);
      title = metadata.title;
      author = metadata.author;
      console.log(`📝 Using video title for summary: "${title}"`);
    } catch (metadataError) {
      console.warn('Failed to fetch video metadata for summary, using videoId:', metadataError);
    }
    
    // Then generate summary using the file content
    const summary = await generateSummary(transcriptData.transcript, modelId, config);

    // Auto-save the summary to server file system with title
    const savedFile = await saveSummaryToServer(videoId, summary, title, modelId, author, config);
    const resolvedModel = savedFile.modelId ?? modelId;

    console.log(`📝 Generated and saved summary for transcript: ${videoId} → ${savedFile.filename}`);
    return { summary, savedFile, modelId: resolvedModel };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error generating summary from file:', error);
    throw new Error(`Failed to generate summary from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save summary to file system on server
 */
export async function saveSummaryToServer(
  videoId: string,
  summary: string,
  title?: string,
  modelId?: string,
  author?: string,
  config: RequestConfig = {}
): Promise<{ filename: string; path: string; modelId?: string }> {
  if (!hasContent(summary)) {
    throw new Error('Summary is empty; nothing to save.');
  }

  const normalizedSummary = normalizeContent(summary);

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/save-summary`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, summary: normalizedSummary, title, modelId, author })
      },
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? SUMMARY_SAVE_TIMEOUT_MS
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save summary to server');
    }

    console.log(`💾 Summary saved to server: ${data.filename}`);
    return { filename: data.filename, path: data.path, modelId: data.modelId ?? modelId };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error saving summary to server:', error);
    throw new Error(`Failed to save summary to server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download summary as file (browser download)
 */
export async function downloadSummary(videoId: string, summary: string): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${videoId}-summary-${timestamp}.md`;
    
    // Create summary content with metadata
    const content = `# YouTube Video Summary

**Video ID:** ${videoId}  
**Generated:** ${new Date().toISOString()}  
**Length:** ${summary.length} characters

---

${summary}`;

    // Auto-download the summary file
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log(`📄 Summary downloaded as: ${filename}`);

  } catch (error) {
    console.error('Error downloading summary:', error);
    throw new Error(`Failed to download summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSavedSummaries(config: RequestConfig = {}): Promise<
  Array<{
    filename: string;
    videoId: string;
    title?: string | null;
    author?: string | null;
    created: string;
    modified: string;
    size: number;
  }>
> {
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/summaries`,
      undefined,
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get saved summaries');
    }
    
    return data.summaries;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error getting saved summaries:', error);
    throw new Error(`Failed to get saved summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read specific summary file from file system
 */
export async function readSavedSummary(
  videoId: string,
  config: RequestConfig = {}
): Promise<{
  videoId: string;
  filename: string;
  summary: string;
  length: number;
  modelId?: string;
  author?: string | null;
}> {
  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/summary-file/${videoId}`,
      undefined,
      {
        signal: config.signal,
        timeoutMs: config.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to read saved summary');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error reading saved summary:', error);
    throw new Error(`Failed to read saved summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download saved summary file as browser download
 */
export async function downloadSavedSummary(videoId: string): Promise<void> {
  try {
    const summaryData = await readSavedSummary(videoId);
    await downloadSummary(videoId, summaryData.summary);
  } catch (error) {
    console.error('Error downloading saved summary:', error);
    throw new Error(`Failed to download saved summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Request PDF export for a saved summary and trigger browser download.
 */
export function downloadSummaryPdf(videoId: string, config?: RequestConfig): Promise<string>;
export function downloadSummaryPdf(videoId: string, title: string | null | undefined, config?: RequestConfig): Promise<string>;
export async function downloadSummaryPdf(
  videoId: string,
  titleOrConfig?: string | null | RequestConfig,
  maybeConfig?: RequestConfig
): Promise<string> {
  let title: string | null | undefined;
  let config: RequestConfig | undefined;

  if (typeof titleOrConfig === 'string' || titleOrConfig === null) {
    title = titleOrConfig;
    config = maybeConfig ?? {};
  } else if (typeof titleOrConfig === 'undefined') {
    title = undefined;
    config = maybeConfig ?? {};
  } else {
    title = undefined;
    config = (titleOrConfig as RequestConfig) ?? {};
  }

  const requestConfig: RequestConfig = config ?? {};

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/summary/${videoId}/pdf`,
      undefined,
      {
        signal: requestConfig.signal,
        timeoutMs: requestConfig.timeoutMs ?? SUMMARY_PDF_TIMEOUT_MS
      }
    );

    if (!response.ok) {
      const errorMessage = await parsePdfError(response);
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const suggestedName = extractFilenameFromDisposition(response.headers.get('Content-Disposition'));
    const filename = resolveSummaryPdfFilename(videoId, title, suggestedName);

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

    return filename;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error exporting summary PDF:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to export PDF: ${message}`);
  }
}

export async function deleteAllSummaries(
  options: { includeTranscripts?: boolean } = {},
  requestConfig: RequestConfig = {}
): Promise<{
  deletedSummaries: number;
  deletedTranscripts: number;
  deletedSummaryFiles?: string[];
  deletedTranscriptFiles?: string[];
}> {
  const params = new URLSearchParams();
  if (options.includeTranscripts) {
    params.set('includeTranscripts', 'true');
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/summaries${query}`,
      {
        method: 'DELETE'
      },
      {
        signal: requestConfig.signal,
        timeoutMs: requestConfig.timeoutMs ?? DELETE_TIMEOUT_MS
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to delete summaries');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error deleting summaries:', error);
    throw new Error(`Failed to delete summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteSummary(
  videoId: string,
  options: { deleteAllVersions?: boolean } = {},
  requestConfig: RequestConfig = {}
): Promise<{
  deletedCount: number;
  deletedFiles: string[];
  deleteAll: boolean;
}> {
  const params = new URLSearchParams();
  if (options.deleteAllVersions) {
    params.set('all', 'true');
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/summary/${videoId}${query}`,
      {
        method: 'DELETE'
      },
      {
        signal: requestConfig.signal,
        timeoutMs: requestConfig.timeoutMs ?? DELETE_TIMEOUT_MS
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to delete summary');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error deleting summary:', error);
    throw new Error(`Failed to delete summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to process a YouTube URL and return a summary
 */
export async function processSummary(
  url: string,
  modelId: string,
  config: RequestConfig = {}
): Promise<{ videoId: string; summary: string; transcript: string; modelId: string }> {
  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Fetch transcript
  const transcript = await fetchTranscript(videoId, config);
  
  // Save transcript
  await saveTranscript(videoId, transcript, false, undefined, config);
  
  // Generate summary
  const summary = await generateSummary(transcript, modelId, config);
  
  return { videoId, summary, transcript, modelId };
}
