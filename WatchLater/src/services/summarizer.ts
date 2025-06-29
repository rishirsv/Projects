import { tryGetTranscript, extractVideoId } from "./youtube";
import { callGeminiAPI } from "./gemini";
// Import the transcript processing prompt as raw text. Vite's `?raw` query
// allows bundling the markdown file contents directly as a string.
import transcriptPrompt from "../../prompts/Youtube transcripts.md?raw";

export async function summarize(url: string): Promise<string> {
  const id = extractVideoId(url);
  const transcript = await tryGetTranscript(id);

  // Start with the base prompt from the markdown file.
  const base = transcriptPrompt.trim();

  const prompt = transcript
    ? `${base}\n\n### TRANSCRIPT\n${transcript}`
    : `${base}\n\nSummarize the YouTube video at ${url} in markdown as if you had its transcript.`;

  const resp = await callGeminiAPI(prompt);
  return resp.text;
}
