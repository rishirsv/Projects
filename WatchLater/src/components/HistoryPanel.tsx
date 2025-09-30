import { memo } from 'react';
import { History, Loader2, RefreshCw, Trash } from 'lucide-react';
import type { SavedSummary } from '../types/summary';
import { formatKilobytes } from '../utils/summary';

type HistoryPanelProps = {
  items: SavedSummary[];
  loading: boolean;
  onRefresh: () => void;
  onClearAll: () => void;
  onSelect: (item: SavedSummary) => void;
  onDelete: (item: SavedSummary, displayTitle: string) => void;
};

const HistoryPanelComponent = ({
  items,
  loading,
  onRefresh,
  onClearAll,
  onSelect,
  onDelete
}: HistoryPanelProps) => (
  <aside className="history-panel">
    <div className="history-header">
      <div className="hero-topline" style={{ letterSpacing: 0 }}>
        <History size={18} /> Saved summaries
      </div>
      <div className="history-actions">
        <button className="action-icon-button" onClick={onRefresh} title="Refresh list">
          {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
        </button>
        <button className="action-icon-button danger" onClick={onClearAll} title="Clear all summaries">
          <Trash size={18} />
        </button>
      </div>
    </div>
    <div className="history-list">
      {loading && <div className="empty-state">Refreshing history…</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state">Summaries will appear here after your first run.</div>
      )}
      {!loading &&
        items.map((saved) => {
          const baseName = saved.filename.replace(/-summary-.*\.md$/, '');
          const [, titlePart] = baseName.split('__');
          const displayTitle = (saved.title ?? titlePart ?? saved.videoId).trim();
          const timestamp = saved.modified ? new Date(saved.modified).toLocaleString() : 'Unknown time';
          const size = saved.size ? formatKilobytes(saved.size) : '';
          const creatorName = saved.author?.trim() || 'Unknown creator';

          return (
            <div key={saved.filename} className="history-item" onClick={() => onSelect(saved)}>
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
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(saved, displayTitle);
                }}
              >
                <Trash size={16} />
              </button>
            </div>
          );
        })}
    </div>
  </aside>
);

export const HistoryPanel = memo(HistoryPanelComponent);
