import { createModelRegistry } from '../src/config/model-registry';

const recommendedModelOptionString = [
  'gemini-2.5-pro|Gemini 2.5 Pro',
  'gemini-2.5-flash|Gemini 2.5 Flash',
  'gemini-1.5-pro|Gemini 1.5 Pro',
  'openrouter/anthropic/claude-3.5-sonnet|Claude 3.5 Sonnet (OpenRouter)',
  'openrouter/anthropic/claude-3.5-haiku|Claude 3.5 Haiku (OpenRouter)',
  'openrouter/openai/gpt-4o|GPT-4o (OpenRouter)',
  'openrouter/openai/gpt-4o-mini|GPT-4o Mini (OpenRouter)',
  'openrouter/x-ai/grok-4|Grok 4 (OpenRouter)',
  'openrouter/meta-llama/llama-3.1-405b-instruct|Llama 3.1 405B (OpenRouter)',
  'openrouter/mistralai/mistral-large-latest|Mistral Large (OpenRouter)'
].join(',');

describe('createModelRegistry', () => {
  it('parses comma-separated options with labels and respects default', () => {
    const registry = createModelRegistry({
      VITE_MODEL_OPTIONS: 'model-a|Model A,model-b|Model B',
      VITE_MODEL_DEFAULT: 'model-b',
    });

    expect(registry.options).toEqual([
      { id: 'model-a', label: 'Model A' },
      { id: 'model-b', label: 'Model B' },
    ]);
    expect(registry.defaultModel).toBe('model-b');
    expect(registry.warnings).toEqual([]);
  });

  it('falls back to first option when default is missing', () => {
    const registry = createModelRegistry({
      VITE_MODEL_OPTIONS: 'model-a|Model A,model-b|Model B',
      VITE_MODEL_DEFAULT: 'missing-model',
    });

    expect(registry.defaultModel).toBe('model-a');
    expect(registry.warnings).toContain(
      'Default model "missing-model" not found in options; falling back to "model-a".',
    );
  });

  it('warns when no options configured', () => {
    const registry = createModelRegistry({
      VITE_MODEL_OPTIONS: '',
      VITE_MODEL_DEFAULT: '',
    });

    expect(registry.options).toEqual([
      { id: 'openrouter/openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenRouter)' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ]);
    expect(registry.defaultModel).toBe('openrouter/openai/gpt-4o-mini');
    expect(registry.warnings).toContain(
      'No model options configured; set VITE_MODEL_OPTIONS to enable the selector. Falling back to GPT-4o Mini defaults.',
    );
  });

  it('uses option id as label when label omitted', () => {
    const registry = createModelRegistry({
      VITE_MODEL_OPTIONS: 'model-a,model-b|Model B',
      VITE_MODEL_DEFAULT: 'model-a',
    });

    expect(registry.options).toEqual([
      { id: 'model-a', label: 'model-a' },
      { id: 'model-b', label: 'Model B' },
    ]);
  });

  it('parses recommended production selector list without loss', () => {
    const registry = createModelRegistry({
      VITE_MODEL_OPTIONS: recommendedModelOptionString,
      VITE_MODEL_DEFAULT: 'gemini-2.5-pro'
    });

    expect(registry.options).toHaveLength(10);
    expect(registry.defaultModel).toBe('gemini-2.5-pro');
    expect(registry.options).toEqual([
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { id: 'openrouter/anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OpenRouter)' },
      { id: 'openrouter/anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku (OpenRouter)' },
      { id: 'openrouter/openai/gpt-4o', label: 'GPT-4o (OpenRouter)' },
      { id: 'openrouter/openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenRouter)' },
      { id: 'openrouter/x-ai/grok-4', label: 'Grok 4 (OpenRouter)' },
      { id: 'openrouter/meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B (OpenRouter)' },
      { id: 'openrouter/mistralai/mistral-large-latest', label: 'Mistral Large (OpenRouter)' }
    ]);
  });
});
