import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent, type MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Download,
  Copy,
  RefreshCw,
  ChevronRight,
  FileText,
  Circle,
  CheckCircle,
  History,
  Search,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Loader2,
  Trash
} from 'lucide-react';
import {
  fetchTranscript,
  saveTranscript,
  generateSummaryFromFile,
  getSavedSummaries,
  readSavedSummary,
  fetchVideoMetadata,
  downloadSummaryPdf,
  deleteSummary,
  deleteAllSummaries
} from './api';
import { extractVideoId } from './utils';
import './App.css';
// Batch import feature removed
import { createModelRegistry } from './config/model-registry';
import { resolveRuntimeEnv } from '../shared/env';
import { ActiveModelProvider } from './context/model-context';
import ModelSelector from './components/ModelSelector';

type SummaryData = {
  videoId: string;
  title: string;
  author: string;
  content: string;
  transcript: string;
  savedFile: string;
  modelId: string;
  keyTakeaways: string[];
  tags: string[];
};

type SavedSummary = {
  filename: string;
  videoId: string;
  title?: string | null;
  author?: string | null;
  created?: string;
  modified?: string;
  size?: number;
};

type PdfExportState = {
  state: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

type DeleteModalState =
  | { mode: 'none' }
  | {
      mode: 'clearAll';
      includeTranscripts: boolean;
      input: string;
      submitting: boolean;
    }
  | {
      mode: 'single';
      videoId: string;
      title: string;
      deleteAllVersions: boolean;
      input: string;
      submitting: boolean;
    };

type ToastState = {
  message: string;
  tone: 'success' | 'error';
};

function composeSummaryDocument(summary: SummaryData): string {
  const lines: string[] = [];
  const trimmedTitle = summary.title.trim();
  const trimmedAuthor = summary.author.trim();
  const trimmedBody = summary.content.trim();

  if (trimmedTitle) {
    lines.push(`# ${trimmedTitle}`);
  }

  if (trimmedAuthor) {
    lines.push(`_by ${trimmedAuthor}_`);
  }

  if (trimmedBody) {
    if (lines.length) {
      lines.push('');
    }
    lines.push(trimmedBody);
  }

  return lines.join('\n\n').replace(/\n{3,}/g, '\n\n');
}

const LEGACY_MODEL_STORAGE_KEY = 'watchlater-active-model';

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

// Batch import constants removed

const WatchLater = () => {
  const modelRegistry = useMemo(() => createModelRegistry(resolveRuntimeEnv()), []);
  const modelStorageKey = useMemo(
    () => `watchlater-active-model:${modelRegistry.defaultModel || 'fallback'}`,
    [modelRegistry.defaultModel]
  );

  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState('');
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [pdfExportState, setPdfExportState] = useState<PdfExportState>({ state: 'idle' });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ mode: 'none' });
  const [deleteModalError, setDeleteModalError] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  // Batch import state removed
  const [activeModelId, setActiveModelId] = useState<string>(() => {
    const fallback = modelRegistry.defaultModel;

    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const stored = window.sessionStorage.getItem(modelStorageKey);
      if (stored && modelRegistry.options.some(option => option.id === stored)) {
        return stored;
      }
      if (stored) {
        console.warn(
          `[model-selector] Stored model "${stored}" not found in current options; falling back to "${fallback}".`
        );
      }

      const legacyStored = window.sessionStorage.getItem(LEGACY_MODEL_STORAGE_KEY);
      if (legacyStored) {
        window.sessionStorage.removeItem(LEGACY_MODEL_STORAGE_KEY);
      }
    } catch (storageError) {
      console.warn('[model-selector] Failed to read stored model preference:', storageError);
    }

    return fallback;
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pdfStatusTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  // Batch import hooks removed

  useEffect(() => {
    if (modelRegistry.warnings.length > 0) {
      for (const warning of modelRegistry.warnings) {
        console.warn(`[model-selector] ${warning}`);
      }
    }
  }, [modelRegistry]);
  // Batch import queue removed

  const updatePdfExportState = useCallback((next: PdfExportState) => {
    if (pdfStatusTimeoutRef.current) {
      window.clearTimeout(pdfStatusTimeoutRef.current);
      pdfStatusTimeoutRef.current = null;
    }

    setPdfExportState(next);

    if (next.state === 'success') {
      pdfStatusTimeoutRef.current = window.setTimeout(() => {
        setPdfExportState({ state: 'idle' });
        pdfStatusTimeoutRef.current = null;
      }, 4000);
    }
  }, []);

  const showToast = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    setToast({ message, tone });

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfStatusTimeoutRef.current) {
        window.clearTimeout(pdfStatusTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (activeModelId) {
        window.sessionStorage.setItem(modelStorageKey, activeModelId);
      } else {
        window.sessionStorage.removeItem(modelStorageKey);
      }
      window.sessionStorage.removeItem(LEGACY_MODEL_STORAGE_KEY);
    } catch (storageError) {
      console.warn('[model-selector] Failed to persist model preference:', storageError);
    }
  }, [activeModelId, modelStorageKey]);

  const isValidModelId = useCallback(
    (candidate: string) => modelRegistry.options.some(option => option.id === candidate),
    [modelRegistry]
  );

  const updateActiveModel = useCallback(
    (nextModelId: string) => {
      if (!isValidModelId(nextModelId)) {
        console.warn(`[model-selector] Ignoring unknown model id "${nextModelId}".`);
        return;
      }
      setActiveModelId(nextModelId);
    },
    [isValidModelId]
  );

  const loadSavedSummaries = useCallback(async () => {
    setLoadingSummaries(true);
    try {
      const summaries = await getSavedSummaries();
      const dedupedByVideo = new Map<string, SavedSummary>();
      for (const summaryItem of summaries) {
        if (!dedupedByVideo.has(summaryItem.videoId)) {
          const normalizedTitle = summaryItem.title?.trim() || null;
          const normalizedAuthor = summaryItem.author?.trim() || null;
          dedupedByVideo.set(summaryItem.videoId, {
            ...summaryItem,
            title: normalizedTitle,
            author: normalizedAuthor
          });
        }
      }
      setSavedSummaries(Array.from(dedupedByVideo.values()));
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

  // Cleanup legacy batch import storage leftovers
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('watchlater-batch-import-queue');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Batch processor registration removed

  // Batch queue state removed

  const completedSummary = status === 'complete' && summary ? summary : null;
  const formattedSummaryDocument = useMemo(
    () => (completedSummary ? composeSummaryDocument(completedSummary) : ''),
    [completedSummary]
  );

  // Batch queue cleanup removed

  const isYouTubeUrl = useCallback((text: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/.test(text);
  }, []);

  // Batch queue item renderer removed

  const handleSummarize = useCallback(
    async (urlToProcess = url) => {
      if (!isYouTubeUrl(urlToProcess) || status === 'processing') return;

      updatePdfExportState({ state: 'idle' });
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

        const result = await generateSummaryFromFile(extractedVideoId, activeModelId);

        setCurrentStage(4);

        const summaryData: SummaryData = {
          videoId: extractedVideoId,
          title: metadata?.title || `Video ${extractedVideoId}`,
          author: metadata?.author || 'Unknown creator',
          content: result.summary,
          transcript: transcriptText,
          savedFile: result.savedFile.filename,
          modelId: result.modelId,
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
      } finally {
        // no-op
      }
    },
    [
      activeModelId,
      
      isYouTubeUrl,
      loadSavedSummaries,
      showToast,
      status,
      updatePdfExportState,
      url
    ]
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
    updatePdfExportState({ state: 'idle' });
  };

  const handleDownload = useCallback(() => {
    if (!summary) return;

    const blob = new Blob([formattedSummaryDocument || summary.content], { type: 'text/markdown' });
    const link = document.createElement('a');
    const downloadUrl = URL.createObjectURL(blob);
    link.href = downloadUrl;
    link.download = `${summary.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, [formattedSummaryDocument, summary]);

  const handleDownloadPdf = useCallback(async () => {
    if (!summary) return;

    updatePdfExportState({ state: 'loading', message: 'Preparing PDF…' });

    try {
      const filename = await downloadSummaryPdf(summary.videoId, summary.title);
      updatePdfExportState({ state: 'success', message: `Downloaded ${filename}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to export PDF';
      updatePdfExportState({ state: 'error', message });
    }
  }, [summary, updatePdfExportState]);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(formattedSummaryDocument || summary.content).catch(err => {
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
      const resolvedAuthor = savedSummary.author?.trim() || summaryData.author?.trim() || 'Unknown creator';

      const displayData: SummaryData = {
        videoId: savedSummary.videoId,
        title: derivedTitle,
        author: resolvedAuthor,
        content: summaryData.summary,
        transcript: '',
        savedFile: summaryData.filename,
        modelId: summaryData.modelId ?? summary?.modelId ?? activeModelId,
        keyTakeaways: extractKeyTakeaways(summaryData.summary),
        tags: extractHashtags(summaryData.summary)
      };

      updatePdfExportState({ state: 'idle' });
      setSummary(displayData);
      setStatus('complete');
      setShowTranscript(false);
      setError('');
    } catch (err) {
      setError(`Failed to load summary: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  const openClearAllModal = () => {
    setDeleteModal({ mode: 'clearAll', includeTranscripts: false, input: '', submitting: false });
    setDeleteModalError('');
  };

  const openSingleDeleteModal = (videoId: string, title: string) => {
    setDeleteModal({
      mode: 'single',
      videoId,
      title,
      deleteAllVersions: false,
      input: '',
      submitting: false
    });
    setDeleteModalError('');
  };

  const closeDeleteModal = () => {
    setDeleteModal({ mode: 'none' });
    setDeleteModalError('');
  };

  const updateDeleteModalInput = (value: string) => {
    setDeleteModal((prev) => {
      if (prev.mode === 'clearAll' || prev.mode === 'single') {
        return { ...prev, input: value };
      }
      return prev;
    });
    setDeleteModalError('');
  };

  const toggleIncludeTranscripts = (checked: boolean) => {
    setDeleteModal((prev) => {
      if (prev.mode !== 'clearAll') {
        return prev;
      }
      return { ...prev, includeTranscripts: checked };
    });
  };

  const toggleDeleteAllVersions = (checked: boolean) => {
    setDeleteModal((prev) => {
      if (prev.mode !== 'single') {
        return prev;
      }
      return { ...prev, deleteAllVersions: checked };
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.mode === 'none') {
      return;
    }

    if (deleteModal.input.trim().toUpperCase() !== 'DELETE') {
      setDeleteModalError('Type DELETE to confirm.');
      return;
    }

    if (deleteModal.mode === 'clearAll') {
      setDeleteModal((prev) => (prev.mode === 'clearAll' ? { ...prev, submitting: true } : prev));
      const previousSummaries = [...savedSummaries];
      setSavedSummaries([]);
      if (summary) {
        setSummary(null);
        setStatus('idle');
        updatePdfExportState({ state: 'idle' });
      }

      try {
        const result = await deleteAllSummaries({ includeTranscripts: deleteModal.includeTranscripts });
        closeDeleteModal();
        showToast(
          `${result.deletedSummaries} ${result.deletedSummaries === 1 ? 'file' : 'files'} deleted`,
          'success'
        );
        await loadSavedSummaries();
      } catch (error) {
        setSavedSummaries(previousSummaries);
        const message = error instanceof Error ? error.message : 'Failed to delete summaries';
        setDeleteModalError(message);
        showToast(message, 'error');
        setDeleteModal((prev) => (prev.mode === 'clearAll' ? { ...prev, submitting: false } : prev));
      }

      return;
    }

    if (deleteModal.mode === 'single') {
      setDeleteModal((prev) => (prev.mode === 'single' ? { ...prev, submitting: true } : prev));
      const previousSummaries = [...savedSummaries];
      setSavedSummaries((prev) => prev.filter((item) => item.videoId !== deleteModal.videoId));
      if (summary?.videoId === deleteModal.videoId) {
        setSummary(null);
        setStatus('idle');
        updatePdfExportState({ state: 'idle' });
      }

      try {
        const result = await deleteSummary(deleteModal.videoId, {
          deleteAllVersions: deleteModal.deleteAllVersions
        });
        closeDeleteModal();
        showToast(
          `${result.deletedCount} ${result.deletedCount === 1 ? 'file' : 'files'} deleted`,
          'success'
        );
        await loadSavedSummaries();
      } catch (error) {
        setSavedSummaries(previousSummaries);
        const message = error instanceof Error ? error.message : 'Failed to delete summary';
        setDeleteModalError(message);
        showToast(message, 'error');
        setDeleteModal((prev) => (prev.mode === 'single' ? { ...prev, submitting: false } : prev));
      }
    }
  };

  const handleHistoryItemDelete = (
    event: MouseEvent<HTMLButtonElement>,
    saved: SavedSummary,
    title: string
  ) => {
    event.stopPropagation();
    openSingleDeleteModal(saved.videoId, title || saved.videoId);
  };

  const summaryCount = savedSummaries.length;
  const isProcessing = status === 'processing';
  const isReturningUser = summaryCount > 0;
  const isSummarizeDisabled = !isYouTubeUrl(url) || isProcessing;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSummarize(url);
  };

  // Batch import modal handlers removed

  // Batch queue controls removed

  return (
    <ActiveModelProvider
      value={{ activeModelId, setActiveModelId: updateActiveModel, registry: modelRegistry }}
    >
      <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <SignalGlyph animated={isProcessing} />
          <span>WatchLater</span>
          <span className="header-badge">Phase 3</span>
        </div>
        <div className="header-actions">
          {/* Batch Import button removed */}
          <div className="header-secondary-actions">
            <span className="header-badge">Saved · {summaryCount}</span>
            <button className="action-icon-button" onClick={loadSavedSummaries} title="Refresh history">
              {loadingSummaries ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            </button>
          </div>
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
          {isReturningUser
            ? `Welcome back! Your ${summaryCount} saved ${summaryCount === 1 ? 'summary is' : 'summaries are'} waiting in history.`
            : 'Paste any YouTube link and receive a richly formatted markdown summary in seconds. Your transcript stays on your machine—perfect for deep work and research workflows.'}
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
          <button type="submit" className="hero-submit" disabled={isSummarizeDisabled}>
            {isProcessing ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
            {isProcessing ? 'Working…' : 'Summarize video'}
          </button>
        </form>
        {/* Batch queue warning removed */}
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
            <div className="summary-card-header">
              <h2 className="summary-title">
                {completedSummary ? completedSummary.title : 'Choose a model to get started'}
              </h2>
              <div className="summary-actions">
                {completedSummary && (
                  <>
                    <button className="action-icon-button" onClick={handleDownload} title="Download markdown">
                      <Download size={18} />
                    </button>
                    <button
                      className="action-icon-button"
                      onClick={handleDownloadPdf}
                      title="Download PDF"
                      disabled={pdfExportState.state === 'loading'}
                    >
                      {pdfExportState.state === 'loading' ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
                    </button>
                    <button className="action-icon-button" onClick={handleCopy} title="Copy to clipboard">
                      <Copy size={18} />
                    </button>
                  </>
                )}
                <ModelSelector />
                {completedSummary && (
                  <>
                    <button className="action-icon-button" onClick={() => handleSummarize(url)} title="Regenerate summary">
                      <RefreshCw size={18} />
                    </button>
                    <button className="action-icon-button" onClick={handleOpenFolder} title="Open local folder">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {completedSummary ? (
              <>
                <div className="summary-meta">
                  <span>Video ID · {completedSummary.videoId}</span>
                  <span>Saved file · {completedSummary.savedFile}</span>
                  {completedSummary.modelId && <span>Model · {completedSummary.modelId}</span>}
                </div>

                {pdfExportState.state !== 'idle' && (
                  <div className={`summary-feedback ${pdfExportState.state}`}>
                    {pdfExportState.state === 'loading' ? 'Preparing PDF…' : pdfExportState.message}
                  </div>
                )}

                {completedSummary.keyTakeaways.length > 0 && (
                  <div className="key-takeaways">
                    <h3>Key takeaways</h3>
                    <ul>
                      {completedSummary.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="summary-markdown">
                  <article className="summary-article">
                    <header className="summary-article__header">
                      <h1 className="summary-article__title">{completedSummary.title}</h1>
                      {completedSummary.author && (
                        <p className="summary-article__creator">by {completedSummary.author}</p>
                      )}
                    </header>
                    <ReactMarkdown>{completedSummary.content}</ReactMarkdown>
                  </article>
                </div>

                {completedSummary.tags.length > 0 && (
                  <div className="summary-tags">
                    {completedSummary.tags.map((tag, idx) => (
                      <span key={idx} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {completedSummary.transcript && (
                  <details
                    className="transcript-toggle"
                    open={showTranscript}
                    onToggle={(event) => setShowTranscript((event.target as HTMLDetailsElement).open)}
                  >
                    <summary>
                      View transcript
                      <ChevronRight size={16} />
                    </summary>
                    {showTranscript && <div className="transcript-content">{completedSummary.transcript}</div>}
                  </details>
                )}
              </>
            ) : (
              <div className="empty-state">
                Paste a YouTube URL above to generate your first summary. You can revisit any saved recap from the history panel.
              </div>
            )}
          </section>
        </div>

        <aside className="history-panel">
          <div className="history-header">
            <div className="hero-topline" style={{ letterSpacing: 0 }}>
              <History size={18} /> Saved summaries
            </div>
            <div className="history-actions">
              <button className="action-icon-button" onClick={loadSavedSummaries} title="Refresh list">
                {loadingSummaries ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
              </button>
              <button
                className="action-icon-button danger"
                onClick={openClearAllModal}
                title="Clear all summaries"
              >
                <Trash size={18} />
              </button>
            </div>
          </div>
          <div className="history-list">
            {loadingSummaries && <div className="empty-state">Refreshing history…</div>}
            {!loadingSummaries && savedSummaries.length === 0 && (
              <div className="empty-state">Summaries will appear here after your first run.</div>
            )}
            {!loadingSummaries &&
              savedSummaries.map((saved) => {
                const baseName = saved.filename.replace(/-summary-.*\.md$/, '');
                const [, titlePart] = baseName.split('__');
                const displayTitle = (saved.title ?? titlePart ?? saved.videoId).trim();
                const timestamp = saved.modified ? new Date(saved.modified).toLocaleString() : 'Unknown time';
                const size = saved.size ? formatKilobytes(saved.size) : '';
                const creatorName = saved.author?.trim() || 'Unknown creator';

                return (
                  <div key={saved.filename} className="history-item" onClick={() => handleHistoryItemClick(saved)}>
                    <div className="history-item-content">
                      <div className="history-item-title">{displayTitle}</div>
                      <div className="history-item-author">{creatorName}</div>
                      <div className="history-item-meta">
                        {timestamp} {size && `· ${size}`}
                      </div>
                    </div>
                    <button
                      className="history-item-delete"
                      title="Delete summary"
                      onClick={(event) => handleHistoryItemDelete(event, saved, displayTitle)}
                    >
                      <Trash size={16} />
                    </button>
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

      {/* Batch import modal removed */}

      {deleteModal.mode !== 'none' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>
              {deleteModal.mode === 'clearAll'
                ? 'Delete all summaries?'
                : `Delete summary for "${deleteModal.title}"?`}
            </h3>
            <p className="modal-description">
              {deleteModal.mode === 'clearAll'
                ? 'This removes every saved summary. Transcripts stay put unless you include them below.'
                : deleteModal.deleteAllVersions
                    ? 'This removes every saved summary for this video.'
                    : 'This removes the most recent summary for this video.'}
            </p>

            {deleteModal.mode === 'clearAll' && (
              <label className="modal-checkbox">
                <input
                  type="checkbox"
                  checked={deleteModal.includeTranscripts}
                  onChange={(event) => toggleIncludeTranscripts(event.target.checked)}
                  disabled={deleteModal.submitting}
                />
                Include transcripts (.txt)
              </label>
            )}

            {deleteModal.mode === 'single' && (
              <label className="modal-checkbox">
                <input
                  type="checkbox"
                  checked={deleteModal.deleteAllVersions}
                  onChange={(event) => toggleDeleteAllVersions(event.target.checked)}
                  disabled={deleteModal.submitting}
                />
                Delete all saved versions for this video
              </label>
            )}

            <label className="modal-input-label">
              Type <span>DELETE</span> to confirm
              <input
                type="text"
                value={deleteModal.input}
                onChange={(event) => updateDeleteModalInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleConfirmDelete();
                  }
                }}
                disabled={deleteModal.submitting}
              />
            </label>

            {deleteModalError && <div className="modal-error">{deleteModalError}</div>}

            <div className="modal-actions">
              <button type="button" onClick={closeDeleteModal} disabled={deleteModal.submitting}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-delete-button"
                onClick={handleConfirmDelete}
                disabled={
                  deleteModal.submitting || deleteModal.input.trim().toUpperCase() !== 'DELETE'
                }
              >
                {deleteModal.submitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.tone}`}>{toast.message}</div>}
      </div>
    </ActiveModelProvider>
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
