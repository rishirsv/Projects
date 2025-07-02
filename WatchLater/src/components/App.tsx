import { useState, lazy, Suspense } from 'react';

// React-Markdown (~125 kB) is only needed when we have a summary.
// By code-splitting it with React.lazy we keep it out of the main chunk
// and download it on-demand, which improves initial load time.
const ReactMarkdown = lazy(() => import('react-markdown'));

import { summarize } from '../services/summarizer';

function App() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSummary('');
    setLoading(true);

    try {
      const summaryResult = await summarize(transcript);
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

    const blob = new Blob([summary], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  return (
    <main>
      <h1>YouTube Transcript Summarizer</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Enter YouTube transcript here..."
          rows={10}
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
          {/* Suspense shows a tiny fallback while the markdown renderer chunk downloads */}
          <Suspense fallback={<p>Loading renderer...</p>}>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </Suspense>
          <button onClick={handleDownload}>Download Summary</button>
        </section>
      )}
    </main>
  );
}

export default App;
