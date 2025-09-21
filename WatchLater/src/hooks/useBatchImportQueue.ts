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

const STORAGE_KEY = 'watchlater-batch-import-queue';
const VALID_STATUSES: BatchQueueStatus[] = ['queued', 'processing', 'succeeded', 'failed'];
const VALID_STAGES: BatchQueueStage[] = [
  'queued',
  'fetchingMetadata',
  'fetchingTranscript',
  'generatingSummary',
  'completed',
  'failed'
];

const nowIso = () => new Date().toISOString();

type PersistedQueueItem = Partial<BatchQueueItem> & {
  videoId?: string;
  url?: string;
};

type PersistedQueueState = {
  items?: Record<string, PersistedQueueItem>;
  order?: unknown;
  activeId?: unknown;
};

const sanitizeQueueState = (candidate: unknown): QueueState => {
  if (!candidate || typeof candidate !== 'object') {
    return initialState;
  }

  const { items: rawItems, order: rawOrder, activeId } = candidate as PersistedQueueState;
  const items: Record<string, BatchQueueItem> = {};
  const fallbackTimestamp = nowIso();

  if (rawItems && typeof rawItems === 'object') {
    for (const [videoId, rawItem] of Object.entries(rawItems)) {
      if (!rawItem || typeof rawItem !== 'object') {
        continue;
      }

      if (typeof videoId !== 'string' || videoId.length === 0) {
        continue;
      }

      const url = typeof rawItem.url === 'string' ? rawItem.url : '';
      if (!url) {
        continue;
      }

      const rawStatus = (rawItem as PersistedQueueItem).status;
      const rawStage = rawItem.stage;

      const status: BatchQueueStatus = VALID_STATUSES.includes(rawStatus as BatchQueueStatus)
        ? (rawStatus as BatchQueueStatus)
        : 'queued';

      const normalizedStatus: BatchQueueStatus = status === 'processing' ? 'queued' : status;

      const stage: BatchQueueStage = VALID_STAGES.includes(rawStage as BatchQueueStage)
        ? (rawStage as BatchQueueStage)
        : 'queued';

      const normalizedStage: BatchQueueStage =
        normalizedStatus === 'queued' && stage !== 'failed' ? 'queued' : stage;

      const attemptsCandidate = (rawItem as PersistedQueueItem).attempts;
      const attempts =
        typeof attemptsCandidate === 'number' && Number.isFinite(attemptsCandidate) && attemptsCandidate >= 0
          ? Math.floor(attemptsCandidate)
          : 0;

      const createdAt =
        typeof rawItem.createdAt === 'string' && rawItem.createdAt.trim().length > 0
          ? rawItem.createdAt
          : fallbackTimestamp;
      const updatedAt =
        typeof rawItem.updatedAt === 'string' && rawItem.updatedAt.trim().length > 0
          ? rawItem.updatedAt
          : createdAt;
      const startedAt =
        typeof rawItem.startedAt === 'string' && rawItem.startedAt.trim().length > 0
          ? rawItem.startedAt
          : undefined;
      const lastAttemptedAt =
        typeof rawItem.lastAttemptedAt === 'string' && rawItem.lastAttemptedAt.trim().length > 0
          ? rawItem.lastAttemptedAt
          : undefined;
      const completedAt =
        normalizedStatus === 'succeeded' &&
        typeof rawItem.completedAt === 'string' &&
        rawItem.completedAt.trim().length > 0
          ? rawItem.completedAt
          : undefined;
      const error =
        normalizedStatus === 'failed' && typeof rawItem.error === 'string'
          ? rawItem.error
          : undefined;

      items[videoId] = {
        videoId,
        url,
        status: normalizedStatus,
        stage: normalizedStage,
        attempts,
        createdAt,
        updatedAt,
        startedAt,
        lastAttemptedAt,
        completedAt,
        error
      };
    }
  }

  const rawOrderArray = Array.isArray(rawOrder) ? rawOrder : [];
  const order: string[] = [];

  for (const entry of rawOrderArray) {
    if (typeof entry === 'string' && items[entry] && !order.includes(entry)) {
      order.push(entry);
    }
  }

  for (const videoId of Object.keys(items)) {
    if (!order.includes(videoId)) {
      order.push(videoId);
    }
  }

  const normalizedActiveId =
    typeof activeId === 'string' && items[activeId] ? activeId : null;

  return {
    items,
    order,
    activeId: normalizedActiveId
  };
};

const loadPersistedQueueState = (): QueueState => {
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }
    const parsed = JSON.parse(raw) as PersistedQueueState;
    return sanitizeQueueState(parsed);
  } catch (error) {
    console.warn('[batch-import] Failed to load queue state from storage:', error);
    return initialState;
  }
};

export const useBatchImportQueue = () => {
  const [state, setState] = useState<QueueState>(() => loadPersistedQueueState());
  const processorRef = useRef<BatchProcessor | null>(null);
  const isProcessingRef = useRef(false);
  const stateRef = useRef<QueueState>(state);
  const lastPersistedSnapshot = useRef<string | null>(null);
  const pauseTokensRef = useRef<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (state.order.length === 0) {
        if (lastPersistedSnapshot.current !== null) {
          window.localStorage.removeItem(STORAGE_KEY);
          lastPersistedSnapshot.current = null;
        }
        return;
      }

      const snapshot = JSON.stringify(state);
      if (snapshot === lastPersistedSnapshot.current) {
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, snapshot);
      lastPersistedSnapshot.current = snapshot;
    } catch (error) {
      console.warn('[batch-import] Failed to persist queue state:', error);
    }
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
      const nextState: QueueState = { ...previous, items, activeId };
      stateRef.current = nextState;
      return nextState;
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
        const nextState: QueueState = { ...previous, items, activeId };
        stateRef.current = nextState;
        return nextState;
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
          const nextState: QueueState = { ...previous, items };
          stateRef.current = nextState;
          return nextState;
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

    if (pauseTokensRef.current.size > 0) {
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
      const nextState: QueueState = { ...previous, items, activeId: nextId };
      stateRef.current = nextState;
      isProcessingRef.current = true;
      return nextState;
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
      const nextState: QueueState = { ...previous, items };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const setProcessingHold = useCallback(
    (token: string, shouldHold: boolean) => {
      const tokens = pauseTokensRef.current;
      const wasPaused = tokens.size > 0;

      if (shouldHold) {
        tokens.add(token);
      } else {
        tokens.delete(token);
      }

      const isPausedNow = tokens.size > 0;
      if (isPausedNow !== wasPaused) {
        setIsPaused(isPausedNow);
        if (!isPausedNow) {
          processNext();
        }
      }
    },
    [processNext]
  );

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
    isProcessing: isProcessingRef.current,
    isPaused,
    setProcessingHold
  };
};

export type UseBatchImportQueueReturn = ReturnType<typeof useBatchImportQueue>;
