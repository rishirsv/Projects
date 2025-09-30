import { memo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { SignalGlyph } from './SignalGlyph';

type AppHeaderProps = {
  isProcessing: boolean;
  summaryCount: number;
  loadingSummaries: boolean;
  onRefresh: () => void;
};

const AppHeaderComponent = ({
  isProcessing,
  summaryCount,
  loadingSummaries,
  onRefresh
}: AppHeaderProps) => (
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
        <button className="action-icon-button" onClick={onRefresh} title="Refresh history">
          {loadingSummaries ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
        </button>
      </div>
    </div>
  </header>
);

export const AppHeader = memo(AppHeaderComponent);
