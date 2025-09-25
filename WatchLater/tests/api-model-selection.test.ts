const mockGenerateContent = jest.fn().mockResolvedValue({
  response: {
    text: jest.fn().mockResolvedValue('Mock summary text'),
  },
});

const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

const mockGoogleGenerativeAI = jest.fn().mockImplementation(() => ({
  getGenerativeModel: mockGetGenerativeModel,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI,
}));

import { saveSummaryToServer, generateSummary } from '../src/api';
import type { RuntimeEnv } from '../shared/env';

type FetchMock = jest.MockedFunction<typeof fetch>;

declare global {
  var __WATCH_LATER_IMPORT_META_ENV__: RuntimeEnv | undefined;
}

const createMockResponse = <T>(payload: T, ok = true): Response =>
  ({
    ok,
    json: () => Promise.resolve(payload),
  } satisfies { ok: boolean; json: () => Promise<T> }) as unknown as Response;

describe('model-aware API surfaces', () => {
  const originalEnv = globalThis.__WATCH_LATER_IMPORT_META_ENV__;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.__WATCH_LATER_IMPORT_META_ENV__ = {
      VITE_GEMINI_API_KEY: 'demo-key',
    } satisfies RuntimeEnv;
  });

  afterAll(() => {
    globalThis.__WATCH_LATER_IMPORT_META_ENV__ = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it('includes modelId in save-summary payload and response', async () => {
    const mockFetch: FetchMock = jest.fn().mockResolvedValue(
      createMockResponse({
        success: true,
        filename: 'video-summary.md',
        path: '/tmp/video-summary.md',
        modelId: 'model-b',
      })
    );

    globalThis.fetch = mockFetch;

    const result = await saveSummaryToServer('video123', 'Hello world', 'My Title', 'model-b', 'Creator Name');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = mockFetch.mock.calls[0];
    expect(requestInit).toBeDefined();
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body.modelId).toBe('model-b');
    expect(body.author).toBe('Creator Name');
    expect(result.modelId).toBe('model-b');
  });

  it('passes model id through to GoogleGenerativeAI', async () => {
    const mockFetch: FetchMock = jest
      .fn()
      .mockResolvedValue(createMockResponse({ prompt: 'Prompt: ' }));

    globalThis.fetch = mockFetch;

    await generateSummary('Sample transcript', 'gemini-pro');

    expect(mockGoogleGenerativeAI).toHaveBeenCalledWith('demo-key');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
  });

  it('falls back to default model when identifier is blank', async () => {
    const mockFetch: FetchMock = jest
      .fn()
      .mockResolvedValue(createMockResponse({ prompt: 'Prompt: ' }));

    globalThis.fetch = mockFetch;

    await generateSummary('Sample transcript', '');

    expect(mockGetGenerativeModel).toHaveBeenLastCalledWith({ model: 'gemini-2.5-flash' });
  });

  it('requests OpenRouter backend when model id uses openrouter prefix', async () => {
    const mockFetch: FetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse({ prompt: 'Prompt: ' }))
      .mockResolvedValueOnce(createMockResponse({ summary: 'OpenRouter summary' }));

    globalThis.fetch = mockFetch;

    const result = await generateSummary('Sample transcript', 'openrouter/google/gpt-4o-mini');

    expect(result).toBe('OpenRouter summary');
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/openrouter/generate',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
