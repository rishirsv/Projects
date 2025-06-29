import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string {
  const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/);
  return m ? m[1] : "";
}

export async function tryGetTranscript(id: string): Promise<string | null> {
  try {
    const arr = await YoutubeTranscript.fetchTranscript(id);
    return (arr as { text: string }[]).map(x => x.text).join(" ");
  } catch {
    return null;
  }
}
