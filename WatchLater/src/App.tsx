import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Download,
  Copy,
  RefreshCw,
  ChevronRight,
  Circle,
  CheckCircle,
  History,
  Search,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import {
  fetchTranscript,
  saveTranscript,
  generateSummaryFromFile,
  getSavedSummaries,
  readSavedSummary,
  fetchVideoMetadata
} from './api';
import { extractVideoId } from './utils';
import './App.css';

type SummaryData = {
  videoId: string;
  title: string;
  author: string;
  content: string;
  transcript: string;
  savedFile: string;
  keyTakeaways: string[];
  tags: string[];
};

type SavedSummary = {
  filename: string;
  videoId: string;
  title?: string | null;
  created?: string;
  modified?: string;
  size?: number;
};

type Stage = {
  id: number;
  title: string;
  description: string;
};

const STAGES: Stage[] = [
  { id: 1, title: 'Metadata', description: 'Video title & channel info' },
  { id: 2, title: 'Transcript', description: 'Supadata fetch & storage' },
  { id: 3, title: 'AI Processing', description: 'Gemini prompt orchestration' },
  { id: 4, title: 'Save', description: 'Markdown summary archived locally' }
];

const WatchLater = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState('');
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadSavedSummaries = useCallback(async () => {
    setLoadingSummaries(true);
    try {
      const summaries = await getSavedSummaries();
      setSavedSummaries(summaries);
    } catch (err) {
      console.error('Error loading saved summaries:', err);
    } finally {
      setLoadingSummaries(false);
    }
  }, []);

  useEffect(() => {
    loadSavedSummaries();
    inputRef.current?.focus();
  }, [loadSavedSummaries]);

  const isYouTubeUrl = useCallback((text: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/.test(text);
  }, []);

  const handleSummarize = useCallback(
    async (urlToProcess = url) => {
      if (!isYouTubeUrl(urlToProcess) || status === 'processing') return;

      setStatus('processing');
      setCurrentStage(1);
      setError('');
      setSummary(null);
      setShowTranscript(false);

      try {
        const extractedVideoId = extractVideoId(urlToProcess);
        if (!extractedVideoId) {
          throw new Error('Invalid YouTube URL');
        }

        let metadata: Awaited<ReturnType<typeof fetchVideoMetadata>> | null = null;
        try {
          metadata = await fetchVideoMetadata(extractedVideoId);
        } catch (metadataError) {
          console.warn('Failed to fetch video metadata, continuing without title:', metadataError);
        }

        setCurrentStage(2);

        const transcriptText = await fetchTranscript(extractedVideoId);
        await saveTranscript(extractedVideoId, transcriptText, false, metadata?.title);

        setCurrentStage(3);

        const result = await generateSummaryFromFile(extractedVideoId);

        setCurrentStage(4);

        const summaryData: SummaryData = {
          videoId: extractedVideoId,
          title: metadata?.title || `Video ${extractedVideoId}`,
          author: metadata?.author || 'Unknown creator',
          content: result.summary,
          transcript: transcriptText,
          savedFile: result.savedFile.filename,
          keyTakeaways: extractKeyTakeaways(result.summary),
          tags: extractHashtags(result.summary)
        };

        setSummary(summaryData);
        setStatus('complete');
        await loadSavedSummaries();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
        setCurrentStage(0);
        console.error('Summarization error:', err);
      }
    },
    [isYouTubeUrl, loadSavedSummaries, status, url]
  );

  useEffect(() => {
    const handlePaste = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target) return;

      setTimeout(() => {
        const pastedText = target.value;
        if (isYouTubeUrl(pastedText) && status === 'idle') {
          setUrl(pastedText);
          setTimeout(() => handleSummarize(pastedText), 50);
        }
      }, 10);
    };

    const input = inputRef.current;
    input?.addEventListener('paste', handlePaste);
    return () => input?.removeEventListener('paste', handlePaste);
  }, [handleSummarize, isYouTubeUrl, status]);

  const handleCancel = () => {
    setStatus('idle');
    setCurrentStage(0);
    setError('');
  };

  const handleDownload = () => {
    if (!summary) return;

    const blob = new Blob([summary.content], { type: 'text/markdown' });
    const link = document.createElement('a');
    const downloadUrl = URL.createObjectURL(blob);
    link.href = downloadUrl;
    link.download = `${summary.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.content).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  const handleOpenFolder = () => {
    alert(`Summaries are saved locally in exports/summaries/\nLatest file: ${summary?.savedFile || 'Not generated yet'}`);
  };

  const handleHistoryItemClick = async (savedSummary: SavedSummary) => {
    try {
      const summaryData = await readSavedSummary(savedSummary.videoId);
      const baseName = summaryData.filename.replace(/-summary-.*\.md$/, '');
      const [, titlePart] = baseName.split('__');
      const derivedTitle = (savedSummary.title ?? titlePart ?? savedSummary.videoId).trim();

      const displayData: SummaryData = {
        videoId: savedSummary.videoId,
        title: derivedTitle,
        author: 'Saved summary',
        content: summaryData.summary,
        transcript: '',
        savedFile: summaryData.filename,
        keyTakeaways: extractKeyTakeaways(summaryData.summary),
        tags: extractHashtags(summaryData.summary)
      };

      setSummary(displayData);
      setStatus('complete');
      setShowTranscript(false);
    } catch (err) {
      setError(`Failed to load summary: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const summaryCount = savedSummaries.length;
  const isProcessing = status === 'processing';
  const isReturningUser = summaryCount > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSummarize(url);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <SignalGlyph animated={isProcessing} />
          <span>WatchLater</span>
          <span className="header-badge">Phase 3</span>
        </div>
        <div className="header-actions">
          <span className="header-badge">Saved · {summaryCount}</span>
          <button className="action-icon-button" onClick={loadSavedSummaries} title="Refresh history">
            {loadingSummaries ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          </button>
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-topline">
          <Sparkles size={16} /> Instant AI summaries without uploads
        </div>
        <h1 className="hero-title">
          Learn faster with <span>Gemini-powered</span> recaps.
        </h1>
        <p className="hero-description">
          Paste any YouTube link and receive a richly formatted markdown summary in seconds. Your transcript stays on your machine—perfect for deep work and research workflows.
        </p>
        <form className="hero-form" onSubmit={handleSubmit}>
          <label className="hero-input-wrapper">
            <Search size={18} className="hero-input-icon" />
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="hero-input"
              disabled={isProcessing}
            />
            {isProcessing && (
              <button type="button" onClick={handleCancel} className="hero-cancel">
                Cancel
              </button>
            )}
          </label>
          <button type="submit" className="hero-submit" disabled={!isYouTubeUrl(url) || isProcessing}>
            {isProcessing ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
            {isProcessing ? 'Working…' : 'Summarize video'}
          </button>
        </form>
        <div className="hero-proof-points">
          <span>
            <ShieldCheck size={16} color="#46e0b1" /> Private, local-first pipeline
          </span>
          <span>
            <Clock size={16} color="#7f5bff" /> Under 10 seconds per recap
          </span>
          <span>
            <Sparkles size={16} color="#46e0b1" /> {summaryCount} summaries saved
          </span>
        </div>
      </section>

      <div className="workspace">
        <div className="workspace-primary">
          <section className="progress-card">
            <div className="progress-header">
              <div className="progress-title">
                {isProcessing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} color="#46e0b1" />}
                <span>Processing pipeline</span>
              </div>
              {status === 'complete' && <span className="status-pill">✓ Summary saved</span>}
            </div>
            <div className="progress-grid">
              {STAGES.map((stage) => {
                const stepClass =
                  currentStage === stage.id
                    ? 'progress-step active'
                    : currentStage > stage.id
                      ? 'progress-step complete'
                      : 'progress-step';

                return (
                  <div key={stage.id} className={stepClass}>
                    <div>
                      {currentStage > stage.id ? (
                        <CheckCircle size={18} color="#46e0b1" />
                      ) : currentStage === stage.id ? (
                        <Loader2 className="spin" size={18} color="#46e0b1" />
                      ) : (
                        <Circle size={18} color="#524a6f" />
                      )}
                    </div>
                    <h4>{stage.title}</h4>
                    <p>{stage.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="summary-card">
            {status === 'complete' && summary ? (
              <>
                <div className="summary-card-header">
                  <h2 className="summary-title">{summary.title}</h2>
                  <div className="summary-actions">
                    <button className="action-icon-button" onClick={handleDownload} title="Download markdown">
                      <Download size={18} />
                    </button>
                    <button className="action-icon-button" onClick={handleCopy} title="Copy to clipboard">
                      <Copy size={18} />
                    </button>
                    <button className="action-icon-button" onClick={() => handleSummarize(url)} title="Regenerate summary">
                      <RefreshCw size={18} />
                    </button>
                    <button className="action-icon-button" onClick={handleOpenFolder} title="Open local folder">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="summary-meta">
                  <span>Video ID · {summary.videoId}</span>
                  <span>Author · {summary.author}</span>
                  <span>Saved file · {summary.savedFile}</span>
                </div>

                {summary.keyTakeaways.length > 0 && (
                  <div className="key-takeaways">
                    <h3>Key takeaways</h3>
                    <ul>
                      {summary.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="summary-markdown">
                  <ReactMarkdown>{summary.content}</ReactMarkdown>
                </div>

                {summary.tags.length > 0 && (
                  <div className="summary-tags">
                    {summary.tags.map((tag, idx) => (
                      <span key={idx} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {summary.transcript && (
                  <details
                    className="transcript-toggle"
                    open={showTranscript}
                    onToggle={(event) => setShowTranscript((event.target as HTMLDetailsElement).open)}
                  >
                    <summary>
                      View transcript
                      <ChevronRight size={16} />
                    </summary>
                    {showTranscript && <div className="transcript-content">{summary.transcript}</div>}
                  </details>
                )}
              </>
            ) : (
              <div className="empty-state">
                Paste a YouTube URL above to generate your first Gemini summary. You can revisit any saved recap from the history panel.
              </div>
            )}
          </section>
        </div>

        <aside className="history-panel">
          <div className="history-header">
            <div className="hero-topline" style={{ letterSpacing: 0 }}>
              <History size={18} /> Saved summaries
            </div>
            <button className="action-icon-button" onClick={loadSavedSummaries} title="Refresh list">
              {loadingSummaries ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            </button>
          </div>
          <div className="history-list">
            {loadingSummaries && <div className="empty-state">Refreshing history…</div>}
            {!loadingSummaries && savedSummaries.length === 0 && <div className="empty-state">Summaries will appear here after your first run.</div>}
            {!loadingSummaries &&
              savedSummaries.map((saved) => {
                const baseName = saved.filename.replace(/-summary-.*\.md$/, '');
                const [, titlePart] = baseName.split('__');
                const displayTitle = (saved.title ?? titlePart ?? saved.videoId).trim();
                const timestamp = saved.modified ? new Date(saved.modified).toLocaleString() : 'Unknown time';
                const size = saved.size ? formatKilobytes(saved.size) : '';

                return (
                  <div key={saved.filename} className="history-item" onClick={() => handleHistoryItemClick(saved)}>
                    <div className="history-item-title">{displayTitle}</div>
                    <div className="history-item-meta">
                      {timestamp} {size && `· ${size}`}
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>
      </div>

      {status === 'error' && (
        <div className="error-banner">
          <div><strong>Something went wrong.</strong> {error}</div>
          <button onClick={() => setStatus('idle')} style={{ marginTop: '12px', color: 'inherit', opacity: 0.8 }}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

const SignalGlyph = ({ animated }: { animated: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="signalGradient" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7f5bff" />
        <stop offset="1" stopColor="#46e0b1" />
      </linearGradient>
    </defs>
    <rect x="6" y="10" width="5" height="12" rx="2" fill="url(#signalGradient)" opacity="0.45" />
    <rect x="13.5" y="7" width="5" height="18" rx="2" fill="url(#signalGradient)" opacity="0.7" />
    <rect x="21" y="4" width="5" height="24" rx="2" fill="url(#signalGradient)" opacity="0.95" />
    <circle
      cx="16"
      cy="27"
      r="3"
      fill="#46e0b1"
      style={animated ? { filter: 'drop-shadow(0 0 8px rgba(70, 224, 177, 0.8))' } : undefined}
    />
  </svg>
);

function extractKeyTakeaways(summaryText: string) {
  const lines = summaryText.split('\n');
  const takeaways: string[] = [];
  let inTakeawaysSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('key takeaways') || line.toLowerCase().includes('key takeaway') || line.toLowerCase().includes('key points')) {
      inTakeawaysSection = true;
      continue;
    }
    if (inTakeawaysSection && (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+[.)]/.test(line.trim()))) {
      takeaways.push(line.trim().replace(/^[-•\d.)\s]+/, ''));
    }
    if (inTakeawaysSection && line.trim() === '' && takeaways.length > 0) {
      break;
    }
  }

  return takeaways.slice(0, 4);
}

function extractHashtags(summaryText: string) {
  const hashtagMatches = summaryText.match(/#[\w-]+/g);
  return hashtagMatches ? hashtagMatches.slice(0, 3) : [];
}

function formatKilobytes(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default WatchLater;
