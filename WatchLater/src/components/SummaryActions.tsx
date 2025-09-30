import type { FC } from 'react';
import { ChevronRight, Copy, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import ModelSelector from './ModelSelector';
import type { PdfExportState, SummaryData } from '../types/summary';

type SummaryActionsProps = {
  summary: SummaryData | null;
  pdfState: PdfExportState;
  onDownloadMd: () => void;
  onDownloadPdf: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onOpenFolder: () => void;
};

export const SummaryActions: FC<SummaryActionsProps> = ({
  summary,
  pdfState,
  onDownloadMd,
  onDownloadPdf,
  onCopy,
  onRegenerate,
  onOpenFolder
}) => (
  <div className="summary-actions">
    {summary && (
      <>
        <button className="action-icon-button" onClick={onDownloadMd} title="Download markdown">
          <Download size={18} />
        </button>
        <button
          className="action-icon-button"
          onClick={onDownloadPdf}
          title="Download PDF"
          disabled={pdfState.state === 'loading'}
        >
          {pdfState.state === 'loading' ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
        </button>
        <button className="action-icon-button" onClick={onCopy} title="Copy to clipboard">
          <Copy size={18} />
        </button>
      </>
    )}
    <ModelSelector />
    {summary && (
      <>
        <button className="action-icon-button" onClick={onRegenerate} title="Regenerate summary">
          <RefreshCw size={18} />
        </button>
        <button className="action-icon-button" onClick={onOpenFolder} title="Open local folder">
          <ChevronRight size={18} />
        </button>
      </>
    )}
  </div>
);
