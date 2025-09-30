import { useCallback, useEffect, useRef, useState } from 'react';
import type { PdfExportState } from '../types/summary';

const RESET_DELAY_MS = 4000;

export const usePdfExport = () => {
  const [pdfExportState, setPdfExportState] = useState<PdfExportState>({ state: 'idle' });
  const timeoutRef = useRef<number | null>(null);

  const cancelReset = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleReset = useCallback(() => {
    cancelReset();
    timeoutRef.current = window.setTimeout(() => {
      setPdfExportState({ state: 'idle' });
      timeoutRef.current = null;
    }, RESET_DELAY_MS);
  }, [cancelReset]);

  const updatePdfExportState = useCallback((next: PdfExportState) => {
    cancelReset();
    setPdfExportState(next);

    if (next.state === 'success') {
      scheduleReset();
    }
  }, [cancelReset, scheduleReset]);

  useEffect(() => {
    return () => {
      cancelReset();
    };
  }, [cancelReset]);

  return { pdfExportState, setPdfExportState: updatePdfExportState, cancelPdfStatusReset: cancelReset };
};
