import { createModelRegistry } from '../src/config/model-registry';

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
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
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
});
