/** @jest-environment jsdom */
import React, { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  useBatchImportQueue,
  type UseBatchImportQueueReturn
} from '../src/hooks/useBatchImportQueue';

let queueReadyResolver: ((queue: UseBatchImportQueueReturn) => void) | null = null;

const TEST_VIDEO_ID = 'heartbeat-video';

const TestHarness: React.FC = () => {
  const queue = useBatchImportQueue();

  useEffect(() => {
    queueReadyResolver?.(queue);
  }, [queue]);

  return null;
};

describe('Batch queue heartbeat support', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    const testGlobals = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    };
    testGlobals.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    localStorage.clear();
    sessionStorage.clear();
    queueReadyResolver = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.useRealTimers();
    queueReadyResolver = null;
  });

  it('refreshes stage timestamps even when the stage label stays the same', async () => {
    const queueReady = new Promise<UseBatchImportQueueReturn>((resolve) => {
      queueReadyResolver = resolve;
    });

    await act(async () => {
      root.render(<TestHarness />);
    });

    const queue = await queueReady;

    await act(async () => {
      queue.enqueue([
        {
          videoId: TEST_VIDEO_ID,
          url: `https://www.youtube.com/watch?v=${TEST_VIDEO_ID}`
        }
      ]);
    });

    await act(async () => {
      queue.updateStage(TEST_VIDEO_ID, 'fetchingTranscript');
    });

    const initialItem = queue.getItem(TEST_VIDEO_ID);
    expect(initialItem?.stage).toBe('fetchingTranscript');
    expect(initialItem?.stageUpdatedAt).toBeTruthy();
    const initialTimestamp = initialItem?.stageUpdatedAt;

    jest.advanceTimersByTime(15_000);
    jest.setSystemTime(new Date('2024-01-01T00:00:15.000Z'));

    await act(async () => {
      queue.updateStage(TEST_VIDEO_ID, 'fetchingTranscript');
    });

    const refreshedItem = queue.getItem(TEST_VIDEO_ID);
    expect(refreshedItem?.stage).toBe('fetchingTranscript');
    expect(refreshedItem?.stageUpdatedAt).toBeTruthy();
    expect(refreshedItem?.stageUpdatedAt).not.toBe(initialTimestamp);
  });
});
