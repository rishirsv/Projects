import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractVideoId } from './utils';

// Backend server URL
const SERVER_URL = 'http://localhost:3001';

/**
 * Fetch prompt template from backend
 */
async function fetchPromptTemplate(): Promise<string> {
  try {
    const response = await fetch(`${SERVER_URL}/api/prompt`);
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
 * Fetch transcript for a YouTube video via local server (using Supadata API)
 */
export async function fetchTranscript(videoId: string): Promise<string> {
  console.log('Fetching transcript via local server (Supadata API) for video ID:', videoId);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    if (!data.success || !data.transcript) {
      throw new Error('No transcript data received from server');
    }

    console.log(`Transcript received: ${data.length} characters, ${data.items} items`);
    return data.transcript;

  } catch (error) {
    // Check if server is running
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to transcript server at ${SERVER_URL}. Make sure to run: npm run server`);
    }
    
    console.error('Transcript fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch transcript: ${errorMessage}`);
  }
}

/**
 * Generate summary using Gemini API with dynamic prompt loading
 */
export async function generateSummary(transcript: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    // Fetch prompt template dynamically from backend
    const promptTemplate = await fetchPromptTemplate();
    const prompt = promptTemplate + transcript;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save transcript to file system and localStorage
 */
export async function saveTranscript(videoId: string, transcript: string, autoDownload = false): Promise<void> {
  try {
    // Save to backend file system
    const response = await fetch(`${SERVER_URL}/api/save-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, transcript })
    });

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
Length: ${transcript.length} characters

---

${transcript}`;

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
      transcript,
      timestamp: new Date().toISOString(),
      length: transcript.length,
      savedToFile: true,
      filename: data.filename
    }));

    console.log(`📱 Transcript also saved to localStorage with key: ${storageKey}`);

  } catch (error) {
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
        console.warn(`Failed to parse stored transcript for key: ${key}`);
      }
    }
  }
  
  return transcripts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get all saved transcripts from file system
 */
export async function getSavedTranscripts(): Promise<Array<{ filename: string; videoId: string; created: string; modified: string; size: number }>> {
  try {
    const response = await fetch(`${SERVER_URL}/api/transcripts`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get saved transcripts');
    }
    
    return data.transcripts;
  } catch (error) {
    console.error('Error getting saved transcripts:', error);
    throw new Error(`Failed to get saved transcripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read specific transcript file from file system
 */
export async function readSavedTranscript(videoId: string): Promise<{ videoId: string; filename: string; transcript: string; length: number }> {
  try {
    const response = await fetch(`${SERVER_URL}/api/transcript-file/${videoId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to read saved transcript');
    }
    
    return data;
  } catch (error) {
    console.error('Error reading saved transcript:', error);
    throw new Error(`Failed to read saved transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate summary from saved transcript file and auto-save to server
 */
export async function generateSummaryFromFile(videoId: string): Promise<{ summary: string; savedFile: { filename: string; path: string } }> {
  try {
    // First, read the transcript from file
    const transcriptData = await readSavedTranscript(videoId);
    
    // Then generate summary using the file content
    const summary = await generateSummary(transcriptData.transcript);
    
    // Auto-save the summary to server file system
    const savedFile = await saveSummaryToServer(videoId, summary);
    
    console.log(`📝 Generated and saved summary for transcript: ${videoId} → ${savedFile.filename}`);
    return { summary, savedFile };
    
  } catch (error) {
    console.error('Error generating summary from file:', error);
    throw new Error(`Failed to generate summary from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save summary to file system on server
 */
export async function saveSummaryToServer(videoId: string, summary: string): Promise<{ filename: string; path: string }> {
  try {
    const response = await fetch(`${SERVER_URL}/api/save-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, summary })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save summary to server');
    }

    console.log(`💾 Summary saved to server: ${data.filename}`);
    return { filename: data.filename, path: data.path };

  } catch (error) {
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

/**
 * Get all saved summaries from file system
 */
export async function getSavedSummaries(): Promise<Array<{ filename: string; videoId: string; created: string; modified: string; size: number }>> {
  try {
    const response = await fetch(`${SERVER_URL}/api/summaries`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get saved summaries');
    }
    
    return data.summaries;
  } catch (error) {
    console.error('Error getting saved summaries:', error);
    throw new Error(`Failed to get saved summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read specific summary file from file system
 */
export async function readSavedSummary(videoId: string): Promise<{ videoId: string; filename: string; summary: string; length: number }> {
  try {
    const response = await fetch(`${SERVER_URL}/api/summary-file/${videoId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to read saved summary');
    }
    
    return data;
  } catch (error) {
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
 * Main function to process a YouTube URL and return a summary
 */
export async function processSummary(url: string): Promise<{ videoId: string; summary: string; transcript: string }> {
  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Fetch transcript
  const transcript = await fetchTranscript(videoId);
  
  // Save transcript
  await saveTranscript(videoId, transcript);
  
  // Generate summary
  const summary = await generateSummary(transcript);
  
  return { videoId, summary, transcript };
}