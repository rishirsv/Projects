import type { ReactNode } from 'react';
import { Icon } from './Icon';

type SummaryListItemProps = {
  title: string;
  subtitle?: ReactNode;
  videoId: string;
  modified: string;
  sizeInBytes: number;
  onOpen: () => void;
  onDownload: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  isActive?: boolean;
};

const formatSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '—';
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.max(1, Math.round(kilobytes))} KB`;
  }
  return `${(kilobytes / 1024).toFixed(1)} MB`;
};

export function SummaryListItem({
  title,
  subtitle,
  videoId,
  modified,
  sizeInBytes,
  onOpen,
  onDownload,
  onCopy,
  onDelete,
  isActive = false,
}: SummaryListItemProps) {
  const formattedDate = new Date(modified).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <article className="summary-item" data-active={isActive} aria-labelledby={`summary-${videoId}`}>
      <div>
        <h4 id={`summary-${videoId}`} className="summary-item__title">
          {title}
        </h4>
        <div className="summary-item__meta">
          <span>{formattedDate}</span>
          <span aria-hidden>•</span>
          <span>{formatSize(sizeInBytes)}</span>
          {subtitle ? <span aria-hidden>•</span> : null}
          {subtitle}
        </div>
      </div>
      <div className="summary-item__actions">
        <button type="button" className="button button-quiet" onClick={onOpen} aria-label={`Open summary for ${title}`}>
          <Icon name="open" size={16} /> View
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={onDownload}
          aria-label={`Download summary for ${title}`}
        >
          <Icon name="download" size={16} /> Download
        </button>
        {onCopy ? (
          <button
            type="button"
            className="button button-quiet"
            onClick={onCopy}
            aria-label={`Copy summary for ${title}`}
          >
            <Icon name="copy" size={16} /> Copy
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="button button-quiet"
            onClick={onDelete}
            aria-label={`Delete summary for ${title}`}
          >
            <Icon name="trash" size={16} /> Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}
