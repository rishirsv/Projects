import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BatchImportRequest } from '../components/BatchImportModal';

export type BatchQueueStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export type BatchQueueStage =
  | 'queued'
  | 'fetchingMetadata'
  | 'fetchingTranscript'
  | 'generatingSummary'
  | 'completed'
  | 'failed';

export type BatchProcessorResult =
  | void
  | { status: 'succeeded'; stage?: BatchQueueStage }
  | { status: 'failed'; stage?: BatchQueueStage; error?: string };

export type BatchProcessorControls = {
  updateStage: (stage: BatchQueueStage) => void;
};

export type BatchProcessor = (
  item: BatchQueueItem,
  controls: BatchProcessorControls
) => Promise<BatchProcessorResult> | BatchProcessorResult;

export type BatchQueueItem = {
  videoId: string;
  url: string;
  status: BatchQueueStatus;
  stage: BatchQueueStage;
  attempts: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  lastAttemptedAt?: string;
  completedAt?: string;
};

type QueueState = {
  items: Record<string, BatchQueueItem>;
  order: string[];
  activeId: string | null;
};

type EnqueueSkipReason =
  | 'alreadyQueued'
  | 'alreadyProcessing'
  | 'alreadyCompleted'
  | 'failedNeedsRetry';

type EnqueueResult = {
  added: BatchQueueItem[];
  skipped: Array<{
    videoId: string;
    url: string;
    reason: EnqueueSkipReason;
  }>;
};

const initialState: QueueState = {
  items: {},
  order: [],
  activeId: null
};

const nowIso = () => new Date().toISOString();

export const useBatchImportQueue = () => {
  const [state, setState] = useState<QueueState>(initialState);
  const processorRef = useRef<BatchProcessor | null>(null);
  const isProcessingRef = useRef(false);
  const stateRef = useRef<QueueState>(initialState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const markSuccess = useCallback((videoId: string, stage: BatchQueueStage = 'completed') => {
    const timestamp = nowIso();
    setState((previous) => {
      const current = previous.items[videoId];
      if (!current) {
        return previous;
      }

      const nextItem: BatchQueueItem = {
        ...current,
        status: 'succeeded',
        stage,
        error: undefined,
        updatedAt: timestamp,
        completedAt: timestamp
      };

      if (
        nextItem.status === current.status &&
        nextItem.stage === current.stage &&
        nextItem.error === current.error
      ) {
        return previous;
      }

      const items = { ...previous.items, [videoId]: nextItem };
      const activeId = previous.activeId === videoId ? null : previous.activeId;
      return { ...previous, items, activeId };
    });
  }, []);

  const markFailure = useCallback(
    (videoId: string, errorMessage: string, stage: BatchQueueStage = 'failed') => {
      const timestamp = nowIso();
      setState((previous) => {
        const current = previous.items[videoId];
        if (!current) {
          return previous;
        }

        const nextItem: BatchQueueItem = {
          ...current,
          status: 'failed',
          stage,
          error: errorMessage,
          updatedAt: timestamp
        };

        if (
          nextItem.status === current.status &&
          nextItem.stage === current.stage &&
          nextItem.error === current.error
        ) {
          return previous;
        }

        const items = { ...previous.items, [videoId]: nextItem };
        const activeId = previous.activeId === videoId ? null : previous.activeId;
        return { ...previous, items, activeId };
      });
    },
    []
  );

  const createControls = useCallback(
    (videoId: string): BatchProcessorControls => ({
      updateStage: (stage: BatchQueueStage) => {
        setState((previous) => {
          const current = previous.items[videoId];
          if (!current || current.stage === stage) {
            return previous;
          }

          const nextItem: BatchQueueItem = {
            ...current,
            stage,
            updatedAt: nowIso()
          };

          const items = { ...previous.items, [videoId]: nextItem };
          return { ...previous, items };
        });
      }
    }),
    []
  );

  const processNext = useCallback(() => {
    if (isProcessingRef.current) {
      return;
    }

    const processor = processorRef.current;
    if (!processor) {
      return;
    }

    const currentState = stateRef.current;
    const nextId = currentState.order.find((candidate) => {
      const item = currentState.items[candidate];
      return item?.status === 'queued';
    });

    if (!nextId) {
      return;
    }

    const timestamp = nowIso();
    let snapshot: BatchQueueItem | null = null;

    setState((previous) => {
      const current = previous.items[nextId];
      if (!current || current.status !== 'queued') {
        return previous;
      }

      const nextItem: BatchQueueItem = {
        ...current,
        status: 'processing',
        stage: current.stage === 'queued' ? 'queued' : current.stage,
        attempts: current.attempts + 1,
        startedAt: timestamp,
        lastAttemptedAt: timestamp,
        updatedAt: timestamp
      };

      snapshot = nextItem;
      const items = { ...previous.items, [nextId]: nextItem };
      isProcessingRef.current = true;
      return { ...previous, items, activeId: nextId };
    });

    if (!snapshot) {
      isProcessingRef.current = false;
      return;
    }

    const controls = createControls(nextId);

    Promise.resolve(processor(snapshot, controls))
      .then((result) => {
        if (!result || result.status === 'succeeded') {
          markSuccess(nextId, result?.stage ?? 'completed');
          return;
        }

        const errorMessage = result.error ?? 'Batch item failed';
        markFailure(nextId, errorMessage, result.stage ?? 'failed');
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Batch item failed';
        markFailure(nextId, message, 'failed');
      })
      .finally(() => {
        isProcessingRef.current = false;
        processNext();
      });
  }, [createControls, markFailure, markSuccess]);

  useEffect(() => {
    if (!isProcessingRef.current) {
      processNext();
    }
  }, [state, processNext]);

  const registerProcessor = useCallback(
    (processor: BatchProcessor | null) => {
      processorRef.current = processor;
      if (processor) {
        processNext();
      }
    },
    [processNext]
  );

  const enqueue = useCallback((requests: BatchImportRequest[]): EnqueueResult => {
    const uniqueRequests = new Map<string, BatchImportRequest>();
    requests.forEach((request) => {
      if (!uniqueRequests.has(request.videoId)) {
        uniqueRequests.set(request.videoId, request);
      }
    });

    const added: BatchQueueItem[] = [];
    const skipped: EnqueueResult['skipped'] = [];

    setState((previous) => {
      if (uniqueRequests.size === 0) {
        return previous;
      }

      let changed = false;
      const items = { ...previous.items };
      const order = previous.order.slice();

      for (const request of uniqueRequests.values()) {
        const existing = items[request.videoId];
        if (existing) {
          const reason: EnqueueSkipReason =
            existing.status === 'succeeded'
              ? 'alreadyCompleted'
              : existing.status === 'processing'
                  ? 'alreadyProcessing'
                  : existing.status === 'failed'
                      ? 'failedNeedsRetry'
                      : 'alreadyQueued';

          skipped.push({
            videoId: request.videoId,
            url: request.url,
            reason
          });
          continue;
        }

        const timestamp = nowIso();
        const item: BatchQueueItem = {
          videoId: request.videoId,
          url: request.url,
          status: 'queued',
          stage: 'queued',
          attempts: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        items[request.videoId] = item;
        order.push(request.videoId);
        added.push(item);
        changed = true;
      }

      if (!changed) {
        return previous;
      }

      const nextState: QueueState = {
        items,
        order,
        activeId: previous.activeId
      };

      stateRef.current = nextState;
      return nextState;
    });

    if (added.length > 0) {
      processNext();
    }

    return { added, skipped };
  }, [processNext]);

  const getItem = useCallback(
    (videoId: string) => stateRef.current.items[videoId] ?? null,
    []
  );

  const updateStage = useCallback((videoId: string, stage: BatchQueueStage) => {
    setState((previous) => {
      const current = previous.items[videoId];
      if (!current || current.stage === stage) {
        return previous;
      }

      const updated: BatchQueueItem = {
        ...current,
        stage,
        updatedAt: nowIso()
      };

      const items = { ...previous.items, [videoId]: updated };
      return { ...previous, items };
    });
  }, []);

  const retryItem = useCallback(
    (videoId: string) => {
      setState((previous) => {
        const current = previous.items[videoId];
        if (!current || current.status === 'queued') {
          return previous;
        }

        const updated: BatchQueueItem = {
          ...current,
          status: 'queued',
          stage: 'queued',
          error: undefined,
          updatedAt: nowIso()
        };

        const items = { ...previous.items, [videoId]: updated };
        const nextState = { ...previous, items };
        stateRef.current = nextState;
        return nextState;
      });

      processNext();
    },
    [processNext]
  );

  const removeItem = useCallback((videoId: string) => {
    setState((previous) => {
      if (!previous.items[videoId]) {
        return previous;
      }

      const { [videoId]: _removed, ...rest } = previous.items;
      const order = previous.order.filter((id) => id !== videoId);
      const activeId = previous.activeId === videoId ? null : previous.activeId;
      const nextState: QueueState = { items: rest, order, activeId };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setState((previous) => {
      const entries = Object.entries(previous.items);
      const remaining = entries.filter(([, item]) => item.status !== 'succeeded');

      if (remaining.length === entries.length) {
        return previous;
      }

      const items = Object.fromEntries(remaining);
      const order = previous.order.filter((id) => items[id]);
      const nextState: QueueState = {
        items,
        order,
        activeId: previous.activeId && items[previous.activeId] ? previous.activeId : null
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const stats = useMemo(() => {
    const values = Object.values(state.items);
    const counts = values.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { queued: 0, processing: 0, succeeded: 0, failed: 0 } as Record<BatchQueueStatus, number>
    );

    return {
      total: values.length,
      ...counts
    };
  }, [state.items]);

  return {
    state,
    registerProcessor,
    enqueue,
    retryItem,
    removeItem,
    clearCompleted,
    updateStage,
    getItem,
    stats,
    isProcessing: isProcessingRef.current
  };
};

export type UseBatchImportQueueReturn = ReturnType<typeof useBatchImportQueue>;
