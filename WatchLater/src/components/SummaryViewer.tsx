import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight } from 'lucide-react';
import type { PdfExportState, SummaryData } from '../types/summary';

type SummaryViewerProps = {
  summary: SummaryData | null;
  pdfState: PdfExportState;
  showTranscript: boolean;
  onToggleTranscript: (open: boolean) => void;
};

const SummaryViewerComponent = ({
  summary,
  pdfState,
  showTranscript,
  onToggleTranscript
}: SummaryViewerProps) => {
  if (!summary) {
    return null;
  }

  const friendlyModelLabel = summary.modelLabel ?? summary.modelId;
  const showModel = Boolean(summary.modelId);

  return (
    <>
      <div className="summary-markdown">
        <article className="summary-article">
          <header className="summary-article__header">
            <h1 className="summary-article__title">{summary.title}</h1>
            <div className="summary-article__meta">
              {summary.author && (
                <span className="summary-meta__item" data-meta="creator">
                  Creator · {summary.author}
                </span>
              )}
              {showModel && (
                <span className="summary-meta__item" data-meta="model" title={summary.modelId}>
                  Model · {friendlyModelLabel}
                </span>
              )}
              <span className="summary-meta__item" data-meta="video">
                Video ID · {summary.videoId}
              </span>
            </div>
          </header>

          {pdfState.state !== 'idle' && (
            <div className={`summary-feedback ${pdfState.state}`}>
              {pdfState.state === 'loading' ? 'Preparing PDF…' : pdfState.message}
            </div>
          )}

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

          <ReactMarkdown>{summary.content}</ReactMarkdown>
        </article>
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
          onToggle={(event) => onToggleTranscript((event.target as HTMLDetailsElement).open)}
        >
          <summary>
            View transcript
            <ChevronRight size={16} />
          </summary>
          {showTranscript && <div className="transcript-content">{summary.transcript}</div>}
        </details>
      )}
    </>
  );
};

export const SummaryViewer = memo(SummaryViewerComponent);
