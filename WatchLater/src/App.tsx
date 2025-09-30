import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from 'react';
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
import { useToast } from './hooks/useToast';
import { usePdfExport } from './hooks/usePdfExport';
import { Toast } from './components/Toast';
import { AppHeader } from './components/AppHeader';
import { HeroSection } from './components/HeroSection';
import { ProgressPipeline } from './components/ProgressPipeline';
import { SummaryActions } from './components/SummaryActions';
import { SummaryViewer } from './components/SummaryViewer';
import { HistoryPanel } from './components/HistoryPanel';
import { DeleteModal } from './components/DeleteModal';
import { ErrorBanner } from './components/ErrorBanner';
import {
  composeSummaryDocument,
  extractKeyTakeaways,
  extractHashtags
} from './utils/summary';
import type {
  SummaryData,
  SavedSummary,
  DeleteModalState,
  Stage
} from './types/summary';

const LEGACY_MODEL_STORAGE_KEY = 'watchlater-active-model';

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
  const { pdfExportState, setPdfExportState: updatePdfExportState } = usePdfExport();
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ mode: 'none' });
  const [deleteModalError, setDeleteModalError] = useState('');
  const { toast, showToast } = useToast();
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
  // Batch import hooks removed

  useEffect(() => {
    if (modelRegistry.warnings.length > 0) {
      for (const warning of modelRegistry.warnings) {
        console.warn(`[model-selector] ${warning}`);
      }
    }
  }, [modelRegistry]);
  // Batch import queue removed

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

  const openClearAllModal = useCallback(() => {
    setDeleteModal({ mode: 'clearAll', includeTranscripts: false, input: '', submitting: false });
    setDeleteModalError('');
  }, []);

  const openSingleDeleteModal = useCallback((videoId: string, title: string) => {
    setDeleteModal({
      mode: 'single',
      videoId,
      title,
      deleteAllVersions: false,
      input: '',
      submitting: false
    });
    setDeleteModalError('');
  }, []);

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

  const handleHistoryItemDelete = useCallback(
    (saved: SavedSummary, title: string) => {
      openSingleDeleteModal(saved.videoId, title || saved.videoId);
    },
    [openSingleDeleteModal]
  );

  const summaryCount = savedSummaries.length;
  const isProcessing = status === 'processing';
  const isReturningUser = summaryCount > 0;
  const isSummarizeDisabled = !isYouTubeUrl(url) || isProcessing;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSummarize(url);
  };

  const handleRegenerate = useCallback(() => handleSummarize(url), [handleSummarize, url]);
  const handleTranscriptToggle = useCallback((open: boolean) => setShowTranscript(open), [setShowTranscript]);
  const handleUrlChange = useCallback((value: string) => setUrl(value), []);

  // Batch import modal handlers removed

  // Batch queue controls removed

  return (
    <ActiveModelProvider
      value={{ activeModelId, setActiveModelId: updateActiveModel, registry: modelRegistry }}
    >
      <div className="app-shell">
        <AppHeader
          isProcessing={isProcessing}
          summaryCount={summaryCount}
          loadingSummaries={loadingSummaries}
          onRefresh={loadSavedSummaries}
        />

        <HeroSection
          isProcessing={isProcessing}
          isReturningUser={isReturningUser}
          summaryCount={summaryCount}
          url={url}
          isSummarizeDisabled={isSummarizeDisabled}
          inputRef={inputRef}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onUrlChange={handleUrlChange}
        />

        <div className="workspace">
          <div className="workspace-primary">
            <ProgressPipeline
              stages={STAGES}
              currentStage={currentStage}
              status={status}
            />

            <section className="summary-card">
              <div className="summary-card-header">
                <h2 className="summary-title">
                  {completedSummary ? completedSummary.title : 'Choose a model to get started'}
                </h2>
                <SummaryActions
                  summary={completedSummary}
                  pdfState={pdfExportState}
                  onDownloadMd={handleDownload}
                  onDownloadPdf={handleDownloadPdf}
                  onCopy={handleCopy}
                  onRegenerate={handleRegenerate}
                  onOpenFolder={handleOpenFolder}
                />
              </div>

              {completedSummary ? (
                <SummaryViewer
                  summary={completedSummary}
                  pdfState={pdfExportState}
                  showTranscript={showTranscript}
                  onToggleTranscript={handleTranscriptToggle}
                />
              ) : (
                <div className="empty-state">
                  Paste a YouTube URL above to generate your first summary. You can revisit any saved recap from the history panel.
                </div>
              )}
            </section>
          </div>

          <HistoryPanel
            items={savedSummaries}
            loading={loadingSummaries}
            onRefresh={loadSavedSummaries}
            onClearAll={openClearAllModal}
            onSelect={handleHistoryItemClick}
            onDelete={handleHistoryItemDelete}
          />
        </div>

        {status === 'error' && (
          <ErrorBanner message={error} onDismiss={() => setStatus('idle')} />
        )}

        {/* Batch import modal removed */}

        <DeleteModal
          state={deleteModal}
          error={deleteModalError}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          onChangeInput={updateDeleteModalInput}
          onToggleIncludeTranscripts={toggleIncludeTranscripts}
          onToggleDeleteAllVersions={toggleDeleteAllVersions}
        />

        <Toast toast={toast} />
      </div>
    </ActiveModelProvider>
  );
};


export default WatchLater;
