/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import WatchLater from '../src/App';
import * as api from '../src/api';
import type { RuntimeEnv } from '../shared/env';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div data-testid="markdown">{children}</div>
}));

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const setInputValue = (element: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(element, value);
};

describe('WatchLater deletion UI flows', () => {
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

  it('handles clear-all confirmation flow', async () => {
    const getSavedSummariesSpy = jest
      .spyOn(api, 'getSavedSummaries')
      .mockResolvedValueOnce([
        {
          filename: 'video1__Title-summary-2024-01-01T00-00-00.md',
          videoId: 'video1',
          title: 'Sample Title',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          size: 1024
        }
      ])
      .mockResolvedValueOnce([]);

    const deleteAllSummariesSpy = jest
      .spyOn(api, 'deleteAllSummaries')
      .mockResolvedValue({ deletedSummaries: 1, deletedTranscripts: 0 });

    await act(async () => {
      root.render(<WatchLater />);
    });
    await flushPromises();

    expect(getSavedSummariesSpy).toHaveBeenCalled();
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);

    const clearButton = container.querySelector('button[title="Clear all summaries"]') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();

    await act(async () => {
      clearButton.click();
    });

    const modalInput = container.querySelector('.modal-input-label input') as HTMLInputElement;
    expect(modalInput).toBeTruthy();

    await act(async () => {
      setInputValue(modalInput, 'DELETE');
      modalInput.dispatchEvent(new Event('input', { bubbles: true }));
      modalInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flushPromises();

    const confirmButton = container.querySelector('.modal-delete-button') as HTMLButtonElement;
    expect(confirmButton).toBeTruthy();
    expect(confirmButton.disabled).toBe(false);

    await act(async () => {
      confirmButton.click();
    });
    await flushPromises();

    expect(deleteAllSummariesSpy).toHaveBeenCalledWith({ includeTranscripts: false });
    expect(container.querySelectorAll('.history-item')).toHaveLength(0);
    const toast = container.querySelector('.toast.success');
    expect(toast?.textContent).toMatch(/1 file deleted/i);
  });

  it('handles single-item deletion flow', async () => {
    const getSavedSummariesSpy = jest
      .spyOn(api, 'getSavedSummaries')
      .mockResolvedValueOnce([
        {
          filename: 'video2__Another-summary-2024-01-01T00-00-00.md',
          videoId: 'video2',
          title: 'Another Title',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          size: 2048
        }
      ])
      .mockResolvedValueOnce([]);

    const deleteSummarySpy = jest
      .spyOn(api, 'deleteSummary')
      .mockResolvedValue({ deletedCount: 1, deletedFiles: ['video2__Another-summary-2024-01-01T00-00-00.md'], deleteAll: false });

    await act(async () => {
      root.render(<WatchLater />);
    });
    await flushPromises();

    expect(getSavedSummariesSpy).toHaveBeenCalled();
    const deleteButton = container.querySelector('.history-item-delete') as HTMLButtonElement;
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton.click();
    });

    const modalInput = container.querySelector('.modal-input-label input') as HTMLInputElement;
    await act(async () => {
      setInputValue(modalInput, 'DELETE');
      modalInput.dispatchEvent(new Event('input', { bubbles: true }));
      modalInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flushPromises();

    const confirmButton = container.querySelector('.modal-delete-button') as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(false);
    await act(async () => {
      confirmButton.click();
    });
    await flushPromises();

    expect(deleteSummarySpy).toHaveBeenCalledWith('video2', { deleteAllVersions: false });
    expect(container.querySelectorAll('.history-item')).toHaveLength(0);
    const toast = container.querySelector('.toast.success');
    expect(toast?.textContent).toMatch(/1 file deleted/i);
  });
});
