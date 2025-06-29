import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript-plus';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getTranscript(url: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    return transcript.map((item: { text: string }) => item.text).join(' ');
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Could not fetch transcript for the given YouTube URL.');
  }
}

export async function summarizeTranscript(transcript: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Summarize the following YouTube video transcript in a concise and informative way. Provide the key takeaways and a brief overview of the content. Format the output in markdown:

${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error summarizing transcript:', error);
    throw new Error('Failed to summarize the transcript.');
  }
}
