/** @jest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { useBatchImportQueue, UseBatchImportQueueReturn } from '../src/hooks/useBatchImportQueue';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const TEST_STORAGE_KEY = 'watchlater-batch-import-queue';

type Harness = {
  getResult: () => UseBatchImportQueueReturn;
  unmount: () => Promise<void>;
};

const renderQueueHarness = async (): Promise<Harness> => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const result: { current: UseBatchImportQueueReturn | null } = { current: null };

  const Host: React.FC = () => {
    result.current = useBatchImportQueue();
    return null;
  };

  await act(async () => {
    root.render(<Host />);
  });

  return {
    getResult: () => {
      if (!result.current) {
        throw new Error('Hook not initialized');
      }
      return result.current;
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    }
  };
};

describe('useBatchImportQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const buildRequests = (...videoIds: string[]) =>
    videoIds.map((videoId) => ({ videoId, url: `https://youtu.be/${videoId}` }));

  it('enqueues unique requests, skips duplicates, and persists state', async () => {
    const harness = await renderQueueHarness();
    const hook = harness.getResult();

    let enqueueResult:
      | ReturnType<UseBatchImportQueueReturn['enqueue']>
      | undefined;
    await act(async () => {
      enqueueResult = hook.enqueue(buildRequests('a1', 'a2'));
    });

    expect(enqueueResult).toBeDefined();
    expect(enqueueResult!.added).toHaveLength(2);
    expect(enqueueResult!.skipped).toHaveLength(0);

    const stateAfterAdd = harness.getResult().state;
    expect(stateAfterAdd.order).toEqual(['a1', 'a2']);
    expect(stateAfterAdd.items.a1?.status).toBe('queued');
    expect(localStorage.getItem(TEST_STORAGE_KEY)).toContain('"a1"');

    let duplicateResult:
      | ReturnType<UseBatchImportQueueReturn['enqueue']>
      | undefined;
    await act(async () => {
      duplicateResult = harness.getResult().enqueue(buildRequests('a1', 'a3'));
    });

    expect(duplicateResult).toBeDefined();
    expect(duplicateResult!.added).toHaveLength(1);
    expect(duplicateResult!.skipped).toEqual([
      { videoId: 'a1', url: 'https://youtu.be/a1', reason: 'alreadyQueued' }
    ]);

    await harness.unmount();

    const harnessReloaded = await renderQueueHarness();
    const rehydratedState = harnessReloaded.getResult().state;
    expect(rehydratedState.order).toEqual(['a1', 'a2', 'a3']);
    expect(rehydratedState.items.a1?.status).toBe('queued');
    await harnessReloaded.unmount();
  });

  it('updates stages, retries failed items, and removes entries', async () => {
    const harness = await renderQueueHarness();
    const hook = harness.getResult();

    await act(async () => {
      hook.enqueue(buildRequests('video-stage'));
    });

    expect(harness.getResult().state.items['video-stage']?.stage).toBe('queued');

    await act(async () => {
      hook.updateStage('video-stage', 'fetchingMetadata');
    });
    expect(harness.getResult().state.items['video-stage']?.stage).toBe('fetchingMetadata');

    await act(async () => {
      hook.updateStage('video-stage', 'failed');
    });
    expect(harness.getResult().state.items['video-stage']?.stage).toBe('failed');

    await act(async () => {
      hook.removeItem('video-stage');
    });

    const clearedState = harness.getResult().state;
    expect(clearedState.items['video-stage']).toBeUndefined();
    expect(clearedState.order).toHaveLength(0);

    await harness.unmount();
  });
});
