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
  signal: AbortSignal;
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
  stageUpdatedAt?: string;
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

type ActiveJob = {
  videoId: string;
  controller: AbortController;
  stopReason: string | null;
  startedAt: number;
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
const PROCESSING_TIMEOUT_MS = 90_000;
const WATCHDOG_INTERVAL_MS = 5_000;
const STOP_HOLD_TOKEN = 'batch-stop';
const createAbortError = (message: string) => {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

type PersistedQueueItem = Partial<BatchQueueItem> & {
  videoId?: string;
  url?: string;
};

const logQueueEvent = (message: string, payload: Record<string, unknown> = {}) => {
  if (typeof console !== 'undefined') {
    console.info(`[batch-import] ${message}`, payload);
  }
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
      let stageUpdatedAt: string;
      if (typeof rawItem.stageUpdatedAt === 'string' && rawItem.stageUpdatedAt.trim().length > 0) {
        stageUpdatedAt = rawItem.stageUpdatedAt;
      } else if (status === 'queued') {
        stageUpdatedAt = createdAt;
      } else if (status === 'processing') {
        stageUpdatedAt = startedAt ?? updatedAt;
      } else {
        stageUpdatedAt = updatedAt;
      }
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
        stageUpdatedAt,
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
  const activeJobRef = useRef<ActiveJob | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeoutNotifiedRef = useRef<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopRequested, setIsStopRequested] = useState(false);

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
        completedAt: timestamp,
        stageUpdatedAt: timestamp
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
      logQueueEvent('job-succeeded', {
        videoId,
        queueLength: nextState.order.length,
        completedAt: timestamp
      });
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
          updatedAt: timestamp,
          stageUpdatedAt: timestamp
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
        logQueueEvent('job-failed', {
          videoId,
          queueLength: nextState.order.length,
          error: errorMessage
        });
        return nextState;
      });
    },
    []
  );

  const createControls = useCallback(
    (videoId: string, controller: AbortController): BatchProcessorControls => ({
      signal: controller.signal,
      updateStage: (stage: BatchQueueStage) => {
        setState((previous) => {
          const current = previous.items[videoId];
          if (!current || current.stage === stage) {
            return previous;
          }

          const timestamp = nowIso();
          const nextItem: BatchQueueItem = {
            ...current,
            stage,
            updatedAt: timestamp,
            stageUpdatedAt: timestamp
          };

          const items = { ...previous.items, [videoId]: nextItem };
          const nextState: QueueState = { ...previous, items };
          stateRef.current = nextState;
          logQueueEvent('job-stage', { videoId, stage });
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
    let controller: AbortController | null = null;

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
        updatedAt: timestamp,
        stageUpdatedAt: timestamp,
        error: undefined
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

    controller = new AbortController();
    activeJobRef.current = {
      videoId: nextId,
      controller,
      stopReason: null,
      startedAt: Date.now()
    };
    lastTimeoutNotifiedRef.current = null;

    const controls = createControls(nextId, controller);

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
        const activeJob = activeJobRef.current;
        const stopReason = activeJob && activeJob.videoId === nextId ? activeJob.stopReason : null;
        const message = stopReason
          ? stopReason
          : error instanceof Error
              ? error.message
              : 'Batch item failed';
        markFailure(nextId, message, 'failed');
      })
      .finally(() => {
        if (activeJobRef.current && activeJobRef.current.videoId === nextId) {
          activeJobRef.current = null;
        }
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

    let queueLengthAfter = stateRef.current.order.length;
    setState((previous) => {
      if (uniqueRequests.size === 0) {
        queueLengthAfter = previous.order.length;
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
          updatedAt: timestamp,
          stageUpdatedAt: timestamp
        };

        items[request.videoId] = item;
        order.push(request.videoId);
        added.push(item);
        changed = true;
      }

      if (!changed) {
        queueLengthAfter = previous.order.length;
        return previous;
      }

      const nextState: QueueState = {
        items,
        order,
        activeId: previous.activeId
      };

      stateRef.current = nextState;
      queueLengthAfter = nextState.order.length;
      return nextState;
    });

    if (added.length > 0 || skipped.length > 0) {
      logQueueEvent('enqueue', {
        added: added.map((item) => item.videoId),
        skipped: skipped.map((item) => item.videoId),
        queueLength: queueLengthAfter
      });
    }

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
      setIsStopRequested(tokens.has(STOP_HOLD_TOKEN));
      if (isPausedNow !== wasPaused) {
        setIsPaused(isPausedNow);
        if (!isPausedNow) {
          processNext();
        }
        logQueueEvent(isPausedNow ? 'queue-paused' : 'queue-resumed', {
          tokens: Array.from(tokens)
        });
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
          updatedAt: nowIso(),
          stageUpdatedAt: nowIso(),
          startedAt: undefined
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

      const rest = { ...previous.items };
      delete rest[videoId];
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
      logQueueEvent('clear-completed', {
        remaining: nextState.order.length
      });
      return nextState;
    });
  }, []);

  const stopActive = useCallback(
    (reason = 'Batch stopped by user') => {
      const activeId = stateRef.current.activeId;
      if (!activeId) {
        return false;
      }

      setProcessingHold(STOP_HOLD_TOKEN, true);
      const job = activeJobRef.current;
      lastTimeoutNotifiedRef.current = null;

      if (job && job.videoId === activeId && !job.controller.signal.aborted) {
        job.stopReason = reason;
        job.controller.abort(createAbortError(reason));
      } else if (!job) {
        markFailure(activeId, reason, 'failed');
        isProcessingRef.current = false;
        activeJobRef.current = null;
      }

      logQueueEvent('stop-active', { videoId: activeId, reason });
      return true;
    },
    [markFailure, setProcessingHold]
  );

  const stopAll = useCallback(
    (reason = 'Batch stopped by user') => {
      setProcessingHold(STOP_HOLD_TOKEN, true);
      const stoppedActive = stopActive(reason);

      let affected: string[] = [];
      const timestamp = nowIso();

      setState((previous) => {
        const items = { ...previous.items };
        affected = previous.order.filter((id) => {
          const entry = items[id];
          return entry && entry.status === 'queued';
        });

        if (affected.length === 0) {
          return previous;
        }

        for (const id of affected) {
          const current = items[id];
          if (!current) continue;
          items[id] = {
            ...current,
            status: 'failed',
            stage: 'failed',
            error: reason,
            updatedAt: timestamp,
            stageUpdatedAt: timestamp
          };
        }

        const nextState: QueueState = { ...previous, items };
        stateRef.current = nextState;
        return nextState;
      });

      if (affected.length > 0) {
        logQueueEvent('stop-all', { reason, affected });
      }

      return stoppedActive || affected.length > 0;
    },
    [setProcessingHold, stopActive]
  );

  const resumeProcessing = useCallback(() => {
    setProcessingHold(STOP_HOLD_TOKEN, false);
  }, [setProcessingHold]);

  const recoverStalled = useCallback(
    (videoId?: string) => {
      const targetId = videoId ?? stateRef.current.activeId;
      if (!targetId) {
        return false;
      }

      let recovered = false;
      const timestamp = nowIso();

      setState((previous) => {
        const current = previous.items[targetId];
        if (!current || (current.status !== 'processing' && current.status !== 'failed')) {
          return previous;
        }

        const nextItem: BatchQueueItem = {
          ...current,
          status: 'queued',
          stage: 'queued',
          error: undefined,
          startedAt: undefined,
          updatedAt: timestamp,
          stageUpdatedAt: timestamp
        };

        const items = { ...previous.items, [targetId]: nextItem };
        const nextState: QueueState = {
          ...previous,
          items,
          activeId: previous.activeId === targetId ? null : previous.activeId
        };
        stateRef.current = nextState;
        recovered = true;
        return nextState;
      });

      if (recovered) {
        if (activeJobRef.current && activeJobRef.current.videoId === targetId) {
          activeJobRef.current = null;
        }
        isProcessingRef.current = false;
        setProcessingHold(STOP_HOLD_TOKEN, false);
        lastTimeoutNotifiedRef.current = null;
        logQueueEvent('recover-stalled', { videoId: targetId });
        processNext();
      }

      return recovered;
    },
    [processNext, setProcessingHold]
  );

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

  useEffect(() => {
    const checkTimeout = () => {
      const activeId = stateRef.current.activeId;
      if (!activeId) {
        lastTimeoutNotifiedRef.current = null;
        return;
      }

      const item = stateRef.current.items[activeId];
      if (!item || item.status !== 'processing') {
        return;
      }

      const stageTimestamp = item.stageUpdatedAt ?? item.updatedAt ?? item.startedAt;
      if (!stageTimestamp) {
        return;
      }

      const stageTime = Date.parse(stageTimestamp);
      if (!Number.isFinite(stageTime)) {
        return;
      }

      const elapsed = Date.now() - stageTime;
      if (elapsed < PROCESSING_TIMEOUT_MS) {
        return;
      }

      if (lastTimeoutNotifiedRef.current === activeId) {
        return;
      }

      lastTimeoutNotifiedRef.current = activeId;
      const reason = `Processing timed out after ${Math.round(PROCESSING_TIMEOUT_MS / 1000)}s`;
      logQueueEvent('watchdog-timeout', {
        videoId: activeId,
        stage: item.stage,
        elapsedMs: elapsed
      });

      const job = activeJobRef.current;
      if (job && job.videoId === activeId && !job.controller.signal.aborted) {
        job.stopReason = reason;
        job.controller.abort(createAbortError(reason));
        return;
      }

      markFailure(activeId, reason, 'failed');
      isProcessingRef.current = false;
      processNext();
    };

    const intervalId = setInterval(checkTimeout, WATCHDOG_INTERVAL_MS);
    watchdogTimerRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      if (watchdogTimerRef.current === intervalId) {
        watchdogTimerRef.current = null;
      }
    };
  }, [markFailure, processNext]);

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
    setProcessingHold,
    stopActive,
    stopAll,
    resumeProcessing,
    recoverStalled,
    isStopRequested
  };
};

export type UseBatchImportQueueReturn = ReturnType<typeof useBatchImportQueue>;
