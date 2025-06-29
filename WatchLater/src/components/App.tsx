import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { getTranscript, summarizeTranscript } from '../services/summarizer';

function App() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:v=)([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : 'summary';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSummary('');
    setLoading(true);

    try {
      const transcript = await getTranscript(url);
      const summaryResult = await summarizeTranscript(transcript);
      setSummary(summaryResult);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!summary) return;

    const videoId = getYouTubeVideoId(url);
    const blob = new Blob([summary], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${videoId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  return (
    <main>
      <h1>One-Click YouTube Summarizer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {summary && (
        <section>
          <h2>Summary</h2>
          <ReactMarkdown>{summary}</ReactMarkdown>
          <button onClick={handleDownload}>Download Summary</button>
        </section>
      )}
    </main>
  );
}

export default App;
