export type ModelOption = {
  id: string;
  label: string;
};

export type ModelRegistry = {
  options: ModelOption[];
  defaultModel: string;
  warnings: string[];
};

type EnvMap = Record<string, string | undefined>;

function parseOption(entry: string): ModelOption | null {
  const trimmed = entry.trim();
  if (!trimmed) {
    return null;
  }

  const [rawId, rawLabel] = trimmed.split('|');
  const id = (rawId ?? '').trim();
  if (!id) {
    return null;
  }

  const labelCandidate = (rawLabel ?? '').trim();
  return {
    id,
    label: labelCandidate || id,
  };
}

const FALLBACK_OPTIONS: ModelOption[] = [
  { id: 'openrouter/openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenRouter)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
];

const FALLBACK_DEFAULT_ID = FALLBACK_OPTIONS[0]?.id ?? '';

export function createModelRegistry(env: EnvMap): ModelRegistry {
  const rawOptions = env.VITE_MODEL_OPTIONS ?? '';
  const defaultModelId = env.VITE_MODEL_DEFAULT?.trim() ?? '';

  const parsedOptions = rawOptions
    .split(',')
    .map(parseOption)
    .filter((option): option is ModelOption => option !== null);

  const options = parsedOptions.length > 0 ? parsedOptions : FALLBACK_OPTIONS;

  const optionsById = new Map(options.map((option) => [option.id, option]));

  const fallbackDefaultId = parsedOptions.length > 0 ? parsedOptions[0]?.id ?? '' : FALLBACK_DEFAULT_ID;
  const resolvedDefaultId = defaultModelId && optionsById.has(defaultModelId)
    ? defaultModelId
    : fallbackDefaultId;

  const warnings: string[] = [];

  if (!rawOptions.trim()) {
    warnings.push(
      'No model options configured; set VITE_MODEL_OPTIONS to enable the selector. Falling back to GPT-4o Mini defaults.'
    );
  }

  if (defaultModelId && defaultModelId !== resolvedDefaultId) {
    warnings.push(`Default model "${defaultModelId}" not found in options; falling back to "${resolvedDefaultId}".`);
  }

  if (!resolvedDefaultId) {
    warnings.push('Model selector has no valid options; using placeholder value until configured.');
  }

  return {
    options,
    defaultModel: resolvedDefaultId,
    warnings,
  };
}
