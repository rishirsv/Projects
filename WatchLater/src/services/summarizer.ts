import { tryGetTranscript, extractVideoId } from "./youtube";
import { callGeminiAPI } from "./gemini";

export async function summarize(url: string): Promise<string> {
  const id = extractVideoId(url);
  const transcript = await tryGetTranscript(id);

  const prompt = transcript
    ? `### TRANSCRIPT\n${transcript}\n\n### TASK\nSummarize the transcript in markdown.`
    : `Summarize the YouTube video at ${url} in markdown as if you had its transcript.`;

  const resp = await callGeminiAPI(prompt);
  return resp.text;
}
