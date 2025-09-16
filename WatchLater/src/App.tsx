import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  downloadSavedSummary,
  fetchTranscript,
  fetchVideoMetadata,
  generateSummaryFromFile,
  getSavedSummaries,
  readSavedSummary,
  saveTranscript,
} from './api';
import { extractVideoId } from './utils';
import type { SavedSummaryMeta, SummaryData } from './types';
import { AppHeader } from './components/AppHeader';
import { PrimaryCTA } from './components/PrimaryCTA';
import { GlassCard } from './components/GlassCard';
import { PipelineStepper } from './components/PipelineStepper';
import { SummaryListItem } from './components/SummaryListItem';
import { SegmentedControl } from './components/SegmentedControl';
import { Toast } from './components/Toast';
import { Icon } from './components/Icon';
import { mountScrollHeader } from './lib/scroll-header';
import './styles/app.css';

const pipelineSteps = [
  {
    id: 'metadata',
    label: 'Metadata',
    description: 'Validate the YouTube URL and capture the title.',
  },
  {
    id: 'transcript',
    label: 'Transcript',
    description: 'Request captions via the Supadata bridge and store them locally.',
  },
  {
    id: 'processing',
    label: 'AI Processing',
    description: 'Send the transcript to Gemini 2.5 Flash with the structured prompt.',
  },
  {
    id: 'save',
    label: 'Save',
    description: 'Persist the Markdown summary and refresh the history list.',
  },
] as const;

type SegmentId = 'summaries' | 'pipeline' | 'settings';

const THEME_STORAGE_KEY = 'watchlater:theme';
type ThemeMode = 'light' | 'dark';

type ToastState = { type: 'success' | 'error' | 'info'; title: string; message?: string } | null;

type StatusState = 'idle' | 'processing' | 'complete' | 'error';

const isYouTubeUrl = (text: string) => /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/i.test(text.trim());

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
};

const getInitialIsMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
};

function extractKeyTakeaways(summaryText: string): string[] {
  const lines = summaryText.split('\n');
  const takeaways: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/key|takeaway|important/i.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+[.]/.test(trimmed))) {
      takeaways.push(trimmed.replace(/^[-•\d.\s]+/, ''));
    }
    if (inSection && trimmed === '') {
      if (takeaways.length > 0) break;
    }
  }

  return takeaways.slice(0, 4);
}

function extractHashtags(summaryText: string): string[] {
  const matches = summaryText.match(/#[\w-]+/g);
  return matches ? matches.slice(0, 3) : [];
}

function formatSummaryTitle(filename: string, fallbackId: string) {
  const withoutExt = filename.replace(/\.md$/i, '');
  const cleaned = withoutExt.replace(/-summary-.*/i, '').replace(/[-_]+/g, ' ').trim();
  if (!cleaned) return `Video ${fallbackId}`;
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

const vibrate = (duration: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(duration);
  }
};

const WatchLater = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<StatusState>('idle');
  const [currentStage, setCurrentStage] = useState(0);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<SavedSummaryMeta[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [activeTab, setActiveTab] = useState<SegmentId>('summaries');
  const [liveMessage, setLiveMessage] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      console.warn('Unable to persist theme preference', err);
    }
  }, [theme]);

  useEffect(() => {
    if (!headerRef.current) return;
    return mountScrollHeader(headerRef.current);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
    return () => mediaQuery.removeListener(handleChange as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
  }, []);

  const loadSavedSummaries = useCallback(async () => {
    setLoadingSummaries(true);
    try {
      const summaries = await getSavedSummaries();
      summaries.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      setSavedSummaries(summaries);
    } catch (err) {
      console.error('Error loading saved summaries:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setToast({ type: 'error', title: 'Unable to load summaries', message });
    } finally {
      setLoadingSummaries(false);
    }
  }, []);

  useEffect(() => {
    loadSavedSummaries();
    inputRef.current?.focus();
  }, [loadSavedSummaries]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handlePaste = (event: ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData('text') ?? '';
      if (isYouTubeUrl(pastedText)) {
        setUrl(pastedText);
        if (status === 'idle') {
          setTimeout(() => handleSummarize(pastedText), 50);
        }
      }
    };

    input.addEventListener('paste', handlePaste);
    return () => input.removeEventListener('paste', handlePaste);
  }, [status]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleSummarize = useCallback(
    async (initialUrl?: string) => {
      const targetUrl = (initialUrl ?? url).trim();
      if (!targetUrl) return;

      if (status === 'processing') {
        return;
      }

      if (!isYouTubeUrl(targetUrl)) {
        setError('Please enter a valid YouTube URL.');
        setStatus('error');
        setActiveTab('pipeline');
        setErrorStage(1);
        setLiveMessage('Invalid link. Provide a YouTube URL.');
        return;
      }

      setStatus('processing');
      setActiveTab('pipeline');
      setError(null);
      setErrorStage(null);
      setShowTranscript(false);

      let stage = 1;
      setCurrentStage(stage);
      setLiveMessage('Checking video metadata…');

      try {
        const videoId = extractVideoId(targetUrl);
        if (!videoId) {
          throw new Error('We could not extract a video ID from that link.');
        }

        let metadata: { title?: string; author?: string } = {};
        try {
          const data = await fetchVideoMetadata(videoId);
          metadata = { title: data.title, author: data.author };
        } catch (metadataError) {
          console.warn('Metadata lookup failed, continuing without title', metadataError);
        }

        stage = 2;
        setCurrentStage(stage);
        setLiveMessage('Fetching transcript…');

        const transcriptText = await fetchTranscript(videoId);
        await saveTranscript(videoId, transcriptText, false, metadata.title);

        stage = 3;
        setCurrentStage(stage);
        setLiveMessage('Generating AI summary…');

        const result = await generateSummaryFromFile(videoId);

        stage = 4;
        setCurrentStage(stage);
        setLiveMessage('Saving summary…');

        const summaryData: SummaryData = {
          videoId,
          title: metadata.title || `Video ${videoId}`,
          author: metadata.author,
          content: result.summary,
          transcript: transcriptText,
          savedFile: result.savedFile.filename,
          keyTakeaways: extractKeyTakeaways(result.summary),
          tags: extractHashtags(result.summary),
        };

        setSummary(summaryData);
        setStatus('complete');
        setActiveTab('summaries');
        setToast({ type: 'success', title: 'Summary ready', message: result.savedFile.filename });
        vibrate(10);
        await loadSavedSummaries();
        setLiveMessage('Summary ready to review.');
      } catch (err) {
        console.error('Summarization error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setStatus('error');
        setErrorStage(stage);
        setActiveTab('pipeline');
        setToast({ type: 'error', title: 'Unable to finish summary', message });
        setLiveMessage(message);
      }
    },
    [url, status, loadSavedSummaries],
  );

  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setErrorStage(null);
    setCurrentStage(0);
    setLiveMessage('Ready for a new video.');
  };

  const handleSummaryOpen = useCallback(
    async (meta: SavedSummaryMeta) => {
      try {
        const data = await readSavedSummary(meta.videoId);
        const title = formatSummaryTitle(data.filename, meta.videoId);
        const summaryData: SummaryData = {
          videoId: meta.videoId,
          title,
          content: data.summary,
          savedFile: data.filename,
          keyTakeaways: extractKeyTakeaways(data.summary),
          tags: extractHashtags(data.summary),
        };
        setSummary(summaryData);
        setStatus('complete');
        setActiveTab('summaries');
        setShowTranscript(false);
        setLiveMessage(`Loaded saved summary for ${title}.`);
      } catch (err) {
        console.error('Failed to load summary', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setToast({ type: 'error', title: 'Unable to open summary', message });
      }
    },
    [],
  );

  const handleSummaryCopy = useCallback(async (meta: SavedSummaryMeta) => {
    try {
      const data = await readSavedSummary(meta.videoId);
      if (!navigator.clipboard) {
        throw new Error('Clipboard access is not available in this browser.');
      }
      await navigator.clipboard.writeText(data.summary);
      setToast({ type: 'success', title: 'Summary copied', message: meta.filename });
    } catch (err) {
      console.error('Failed to copy summary', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setToast({ type: 'error', title: 'Copy failed', message });
    }
  }, []);

  const handleSummaryDownload = useCallback(async (meta: SavedSummaryMeta) => {
    try {
      await downloadSavedSummary(meta.videoId);
      setToast({ type: 'success', title: 'Download started', message: meta.filename });
    } catch (err) {
      console.error('Failed to download summary', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setToast({ type: 'error', title: 'Download failed', message });
    }
  }, []);

  const summaryCount = savedSummaries.length;

  const segments = useMemo(
    () => [
      { id: 'summaries' as const, label: 'Summaries', badge: summaryCount ? String(summaryCount) : undefined },
      { id: 'pipeline' as const, label: 'Pipeline' },
      { id: 'settings' as const, label: 'Settings' },
    ],
    [summaryCount],
  );

  const themeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const settingsCard = (
    <GlassCard title="Display & accessibility" description="Tune how WatchLater adapts to your environment." as="section">
      <div className="summary-list">
        <div className="summary-item">
          <div className="summary-item__title">Theme</div>
          <div className="summary-item__meta">Switch between light and dark appearance.</div>
          <div className="summary-item__actions">
            <button
              type="button"
              className="button button-quiet"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
            >
              <Icon name="sun" size={16} /> Light
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
            >
              <Icon name="moon" size={16} /> Dark
            </button>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-item__title">Keyboard shortcuts</div>
          <div className="summary-item__meta">Press ⌘/Ctrl + V to paste a link and Enter to summarise.</div>
        </div>
        <div className="summary-item">
          <div className="summary-item__title">Accessibility support</div>
          <div className="summary-item__meta">
            Respects prefers-reduced-motion, prefers-contrast, and reduced-transparency settings automatically.
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const pipelineCard = (
    <GlassCard
      key="pipeline"
      title="Processing pipeline"
      description="Follow each stage of the summarisation workflow."
      as="section"
      id="pipeline-card"
      className="pipeline-card"
    >
      <PipelineStepper
        steps={pipelineSteps}
        currentStage={currentStage}
        status={status}
        errorStage={errorStage}
        busy={status === 'processing'}
      />
      {status === 'processing' ? (
        <p className="small">Hang tight — we are working through the steps above.</p>
      ) : null}
      {status === 'error' && error ? (
        <div className="alert alert--error" role="alert">
          <div className="alert__title">
            <Icon name="exclamationmark.triangle" size={18} /> Something went wrong
          </div>
          <p className="small">{error}</p>
          <div className="alert__actions">
            <button type="button" className="button button-quiet" onClick={handleReset}>
              Try again
            </button>
          </div>
        </div>
      ) : null}
      {status === 'complete' && summary ? (
        <div className="alert alert--success" role="status">
          <div className="alert__title">
            <Icon name="checkmark.circle" size={18} /> Saved to {summary.savedFile}
          </div>
          <p className="small">Find it under exports/summaries on your machine.</p>
        </div>
      ) : null}
    </GlassCard>
  );

  const summariesCard = (
    <GlassCard
      key="summaries"
      title="Saved summaries"
      description="Open, copy, or download the Markdown files generated previously."
      as="aside"
      id="saved-summaries"
      actions={
        <div className="summary-item__actions">
          <span className="small" aria-live="polite">
            {loadingSummaries ? 'Refreshing…' : `${summaryCount} total`}
          </span>
          <button type="button" className="icon-button" onClick={loadSavedSummaries} aria-label="Refresh summaries list">
            <Icon name="refresh" size={18} />
          </button>
        </div>
      }
      className="summary-card"
    >
      {summaryCount === 0 && !loadingSummaries ? (
        <div className="summary-empty">
          <p className="p-body">Summaries you create will appear here for quick access.</p>
        </div>
      ) : null}
      <div className="summary-list" role="list">
        {savedSummaries.map((item) => (
          <SummaryListItem
            key={item.filename}
            title={formatSummaryTitle(item.filename, item.videoId)}
            subtitle={<span>Video ID • {item.videoId}</span>}
            videoId={item.videoId}
            modified={item.modified}
            sizeInBytes={item.size}
            onOpen={() => handleSummaryOpen(item)}
            onDownload={() => handleSummaryDownload(item)}
            onCopy={() => handleSummaryCopy(item)}
            isActive={summary?.videoId === item.videoId}
          />
        ))}
      </div>
    </GlassCard>
  );

  const summaryDetailCard = summary ? (
    <GlassCard
      key="summary-detail"
      title={summary.title}
      description={summary.author ? `Published by ${summary.author}` : undefined}
      headingLevel={2}
      as="article"
      className="summary-detail"
    >
      {summary.keyTakeaways && summary.keyTakeaways.length > 0 ? (
        <div>
          <div className="summary-item__title">Key takeaways</div>
          <ul>
            {summary.keyTakeaways.map((item, index) => (
              <li key={index} className="p-body">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="summary-detail__content">{summary.content}</div>
      {summary.tags && summary.tags.length > 0 ? (
        <div className="summary-tags" aria-label="Suggested tags">
          {summary.tags.map((tag) => (
            <span key={tag} className="summary-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {summary.transcript ? (
        <div>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => setShowTranscript((prev) => !prev)}
            aria-expanded={showTranscript}
            aria-controls="summary-transcript"
          >
            <Icon name="chevron.down" size={16} /> {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showTranscript ? (
            <div id="summary-transcript" className="summary-transcript">
              {summary.transcript}
            </div>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  ) : null;

  const showPipeline = activeTab === 'pipeline' || activeTab === 'summaries';
  const showSummaries = activeTab === 'summaries';
  const showSettings = activeTab === 'settings';

  return (
    <div className="app-shell">
      <AppHeader
        ref={headerRef}
        summaryCount={summaryCount}
        onRefresh={loadSavedSummaries}
        onOpenSettings={() => setActiveTab('settings')}
        onToggleTheme={themeToggle}
        theme={theme}
        hasProcessing={status === 'processing'}
      >
        <SegmentedControl
          segments={segments}
          value={activeTab}
          onChange={(id) => setActiveTab(id as SegmentId)}
          ariaLabel="Primary sections"
        />
      </AppHeader>
      <main className="app-main" role="main">
        <div className="visually-hidden" aria-live="polite">
          {liveMessage}
        </div>
        <GlassCard className="hero" as="section" title={undefined}>
          <span className="eyebrow small">iOS 26 inspired experience</span>
          <h1 className="h-large-title">Learn faster with recaps</h1>
          <p className="p-body">
            Paste any YouTube link to generate a native-feeling summary optimised for your device and preferences.
          </p>
          <div className="input-row">
            <div className="input-row__field">
              <label htmlFor="video-url" className="visually-hidden">
                YouTube URL
              </label>
              <input
                ref={inputRef}
                id="video-url"
                className="input-field"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                aria-describedby="video-helper"
                aria-invalid={status === 'error' && !!error}
                disabled={status === 'processing'}
              />
            </div>
            <div className="input-row__cta">
              <PrimaryCTA
                label={status === 'processing' ? 'Working…' : 'Summarize video'}
                onPress={() => handleSummarize()}
                disabled={status === 'processing'}
                loading={status === 'processing'}
                isSticky={isMobile}
              />
            </div>
          </div>
          <p id="video-helper" className="small">
            Supports transcripts across 50+ languages. All summaries are saved locally for offline review.
          </p>
          {status === 'error' && error ? (
            <p className="small" role="alert">
              {error}
            </p>
          ) : null}
        </GlassCard>

        <div className="cards-grid" data-active-tab={activeTab}>
          {showPipeline ? pipelineCard : null}
          {showSummaries ? summariesCard : null}
          {showSettings ? settingsCard : null}
        </div>

        {showSummaries && summaryDetailCard}
      </main>
      {toast ? <Toast type={toast.type} title={toast.title} message={toast.message} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
};

export default WatchLater;
