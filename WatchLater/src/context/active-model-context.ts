import { createContext } from 'react';
import type { ModelRegistry } from '../config/model-registry';

export type ActiveModelContextValue = {
  activeModelId: string;
  setActiveModelId: (modelId: string) => void;
  registry: ModelRegistry;
};

export const ActiveModelContext = createContext<ActiveModelContextValue | undefined>(undefined);
