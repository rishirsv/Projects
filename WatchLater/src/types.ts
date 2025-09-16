export type PipelineStageId = 'metadata' | 'transcript' | 'processing' | 'save';

export type SummaryData = {
  videoId: string;
  title: string;
  author?: string;
  content: string;
  transcript?: string;
  savedFile: string;
  keyTakeaways?: string[];
  tags?: string[];
};

export type SavedSummaryMeta = {
  filename: string;
  videoId: string;
  created: string;
  modified: string;
  size: number;
};
