/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import WatchLater from '../src/App';
import * as api from '../src/api';
import type { RuntimeEnv } from '../shared/env';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="markdown">{children}</div>
  )
}));

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const setTextareaValue = (element: HTMLTextAreaElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(element, value);
};

describe('Batch import modal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    const testGlobals = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
      __WATCH_LATER_IMPORT_META_ENV__?: RuntimeEnv;
    };
    testGlobals.IS_REACT_ACT_ENVIRONMENT = true;
    testGlobals.__WATCH_LATER_IMPORT_META_ENV__ = { VITE_MODEL_OPTIONS: '[]' };
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    jest
      .spyOn(api, 'getSavedSummaries')
      .mockResolvedValue([]);
    jest
      .spyOn(api, 'fetchVideoMetadata')
      .mockResolvedValue({
        success: true,
        videoId: 'queued-video',
        title: 'Queued video',
        sanitizedTitle: 'queued-video',
        author: 'Channel',
        authorUrl: 'https://example.com',
        thumbnailUrl: '',
        thumbnailWidth: 120,
        thumbnailHeight: 90,
        provider: 'YouTube'
      });
    jest.spyOn(api, 'fetchTranscript').mockResolvedValue('Transcript body');
    jest.spyOn(api, 'saveTranscript').mockResolvedValue(undefined);
    jest.spyOn(api, 'generateSummaryFromFile').mockResolvedValue({
      summary: 'Summary content',
      savedFile: { filename: 'queued-video.md', path: '/tmp/queued-video.md' },
      modelId: 'gemini-2.5-flash'
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.restoreAllMocks();
  });

  it('closes automatically after a successful enqueue', async () => {
    await act(async () => {
      root.render(<WatchLater />);
    });
    await flushPromises();

    const openButton = container.querySelector('.batch-import-button') as HTMLButtonElement;
    expect(openButton).toBeTruthy();

    await act(async () => {
      openButton.click();
    });
    await flushPromises();

    const textarea = container.querySelector('#batch-import-input') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    await act(async () => {
      setTextareaValue(
        textarea,
        'https://youtu.be/video-one\nhttps://www.youtube.com/watch?v=video-two\n'
      );
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flushPromises();

    const submitButton = container.querySelector('.batch-import-submit') as HTMLButtonElement;
    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBe(false);

    await act(async () => {
      submitButton.click();
    });
    await flushPromises();

    expect(container.querySelector('.batch-import-modal')).toBeNull();
    const toast = container.querySelector('.toast.success');
    expect(toast?.textContent).toMatch(/2 videos queued/i);

    await act(async () => {
      openButton.click();
    });
    await flushPromises();

    const reopenedTextarea = container.querySelector('#batch-import-input') as HTMLTextAreaElement;
    expect(reopenedTextarea?.value).toBe('');
  });
});
