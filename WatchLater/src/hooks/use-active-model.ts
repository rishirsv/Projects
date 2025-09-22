import { useContext } from 'react';
import { ActiveModelContext, type ActiveModelContextValue } from '../context/active-model-context';

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
