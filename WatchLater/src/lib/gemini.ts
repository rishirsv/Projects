import { GoogleGenerativeAI } from '@google/generative-ai';
import transcriptPrompt from '../../docs/Youtube transcripts.md?raw';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export async function summarize(transcript: string): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI API key not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `${transcriptPrompt.trim()}\n\n### TRANSCRIPT\n${transcript}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
