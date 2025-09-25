import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { extractVideoId } from '../utils';

const MAX_URLS = 10;
const focusableSelector =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export type BatchImportRequest = {
  videoId: string;
  url: string;
};

type EntryIssue = 'invalidUrl' | 'duplicate' | 'overLimit';

type ParsedEntry = {
  key: string;
  raw: string;
  normalizedUrl: string;
  videoId?: string;
  status: 'valid' | 'invalid';
  issue?: EntryIssue;
  reason?: string;
};

type BatchImportModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (requests: BatchImportRequest[]) => Promise<void> | void;
  isSubmitting?: boolean;
};

const parseEntries = (input: string): ParsedEntry[] => {
  const entries: ParsedEntry[] = [];
  const seenVideoIds = new Set<string>();
  let validCount = 0;

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  lines.forEach((raw, index) => {
    const sanitized = raw.replace(/\s+/g, '');
    const videoId = extractVideoId(sanitized);

    if (!videoId) {
      entries.push({
        key: `${index}-invalid-${raw}`,
        raw,
        normalizedUrl: sanitized || raw,
        status: 'invalid',
        issue: 'invalidUrl',
        reason: 'Enter a valid YouTube link.'
      });
      return;
    }

    if (seenVideoIds.has(videoId)) {
      entries.push({
        key: `${index}-duplicate-${videoId}`,
        raw,
        normalizedUrl: sanitized,
        videoId,
        status: 'invalid',
        issue: 'duplicate',
        reason: 'Already added in this batch.'
      });
      return;
    }

    if (validCount >= MAX_URLS) {
      entries.push({
        key: `${index}-limit-${videoId}`,
        raw,
        normalizedUrl: sanitized,
        videoId,
        status: 'invalid',
        issue: 'overLimit',
        reason: 'Limit reached — keep up to 10 URLs per batch.'
      });
      return;
    }

    seenVideoIds.add(videoId);
    entries.push({
      key: `${index}-valid-${videoId}`,
      raw,
      normalizedUrl: sanitized,
      videoId,
      status: 'valid'
    });
    validCount += 1;
  });

  return entries;
};

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting = false
}) => {
  const [rawInput, setRawInput] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      setRawInput('');
      setSubmissionError(null);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!submissionError) {
      return;
    }
    setSubmissionError(null);
  }, [rawInput, submissionError]);

  const entries = useMemo(() => parseEntries(rawInput), [rawInput]);
  const validEntries = useMemo(() => entries.filter((entry) => entry.status === 'valid'), [entries]);
  const invalidEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'invalid'),
    [entries]
  );
  const hasLimitIssue = entries.some((entry) => entry.issue === 'overLimit');

  const validRequests = useMemo<BatchImportRequest[]>(
    () =>
      validEntries.map((entry) => ({
        videoId: entry.videoId!,
        url: entry.normalizedUrl || entry.raw
      })),
    [validEntries]
  );

  const readyCount = validEntries.length;
  const importDisabled = readyCount === 0 || hasLimitIssue || isSubmitting;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const modalElement = modalRef.current;
      if (!modalElement) {
        return;
      }

      const focusable = Array.from(
        modalElement.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isSubmitting]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (importDisabled) {
        return;
      }

      try {
        await Promise.resolve(onSubmit(validRequests));
        onClose();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to queue imports. Please retry.';
        setSubmissionError(message);
      }
    },
    [importDisabled, onClose, onSubmit, validRequests]
  );

  const handleCancel = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!open) {
    return null;
  }

  const submitLabel = isSubmitting
    ? 'Queuing…'
    : readyCount === 0
        ? 'Queue imports'
        : `Queue ${readyCount} ${readyCount === 1 ? 'video' : 'videos'}`;

  return (
    <div
      className="modal-overlay batch-import-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="batch-import-modal" ref={modalRef}>
        <button
          type="button"
          className="batch-import-close"
          onClick={handleCancel}
          aria-label="Close batch import"
          disabled={isSubmitting}
        >
          <X size={18} />
        </button>

        <div className="batch-import-header">
          <span className="batch-import-kicker">
            <Sparkles size={16} /> Batch import
          </span>
          <h2 id={titleId}>Queue up to 10 YouTube videos</h2>
          <p id={descriptionId} className="batch-import-description">
            Paste your links below — duplicates and invalid entries are flagged automatically.
          </p>
        </div>

        <form className="batch-import-form" onSubmit={handleSubmit}>
          <label className="batch-import-label" htmlFor="batch-import-input">
            YouTube URLs
          </label>
          <textarea
            id="batch-import-input"
            ref={textareaRef}
            value={rawInput}
            onChange={handleChange}
            placeholder={
              'https://www.youtube.com/watch?v=…\nhttps://youtu.be/…\nhttps://youtube.com/watch?v=…'
            }
            rows={8}
            disabled={isSubmitting}
          />

          <div className="batch-import-meta">
            <span className={`batch-import-counter${hasLimitIssue ? ' error' : ''}`}>
              {readyCount} / {MAX_URLS} URLs ready
            </span>
            {invalidEntries.length > 0 ? (
              <span className="batch-import-errors">
                {invalidEntries.length} {invalidEntries.length === 1 ? 'issue' : 'issues'} detected
              </span>
            ) : (
              <span className="batch-import-hint">Press Enter after each link</span>
            )}
          </div>

          <div className="batch-import-entry-list" role="list">
            {entries.length === 0 && (
              <div className="batch-import-entry placeholder" role="listitem">
                Paste YouTube links to validate and queue them automatically.
              </div>
            )}

            {entries.map((entry) => (
              <div
                key={entry.key}
                className={`batch-import-entry ${entry.status}`}
                role="listitem"
              >
                {entry.status === 'valid' ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <AlertCircle size={16} aria-hidden="true" />
                )}
                <div className="batch-import-entry-body">
                  <span className="batch-import-entry-url">{entry.raw}</span>
                  {entry.reason && (
                    <span className="batch-import-entry-reason">{entry.reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {submissionError && <div className="batch-import-submit-error">{submissionError}</div>}

          <div className="batch-import-actions">
            <button type="button" className="batch-import-cancel" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="batch-import-submit" disabled={importDisabled}>
              {isSubmitting && <Loader2 size={16} className="spin" aria-hidden="true" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchImportModal;
