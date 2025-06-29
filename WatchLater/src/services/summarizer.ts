import transcriptPrompt from "../../prompts/Youtube transcripts.md?raw";

export async function summarize(transcript: string): Promise<string> {
  const response = await fetch('http://localhost:3001/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript, prompt: transcriptPrompt.trim() }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to summarize');
  }

  const data = await response.json();
  return data.summary;
}
