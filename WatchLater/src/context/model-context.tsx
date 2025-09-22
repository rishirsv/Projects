import React, { createContext, useContext } from 'react';
import type { ModelRegistry } from '../config/model-registry';

type ActiveModelContextValue = {
  activeModelId: string;
  setActiveModelId: (modelId: string) => void;
  registry: ModelRegistry;
};

const ActiveModelContext = createContext<ActiveModelContextValue | undefined>(undefined);

export const ActiveModelProvider: React.FC<{
  value: ActiveModelContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <ActiveModelContext.Provider value={value}>{children}</ActiveModelContext.Provider>;
};

export function useActiveModel(): ActiveModelContextValue {
  const context = useContext(ActiveModelContext);
  if (!context) {
    throw new Error('useActiveModel must be used within an ActiveModelProvider');
  }
  return context;
}

export function useModelOptions() {
  return useActiveModel().registry.options;
}

export function useDefaultModel() {
  return useActiveModel().registry.defaultModel;
}
