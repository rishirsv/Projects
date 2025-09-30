export type SummaryData = {
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

export type SavedSummary = {
  filename: string;
  videoId: string;
  title?: string | null;
  author?: string | null;
  created?: string;
  modified?: string;
  size?: number;
};

export type PdfExportState = {
  state: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

export type DeleteModalState =
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

export type Stage = {
  id: number;
  title: string;
  description: string;
};
