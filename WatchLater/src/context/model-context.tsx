import React from 'react';
import { ActiveModelContext, type ActiveModelContextValue } from './active-model-context';

type ActiveModelProviderProps = {
  value: ActiveModelContextValue;
  children: React.ReactNode;
};

export const ActiveModelProvider: React.FC<ActiveModelProviderProps> = ({ value, children }) => {
  return <ActiveModelContext.Provider value={value}>{children}</ActiveModelContext.Provider>;
};
