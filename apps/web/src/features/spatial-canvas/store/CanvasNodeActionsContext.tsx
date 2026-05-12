'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface CanvasNodeActions {
  onEditNode: (nodeId: string) => void;

  onDeleteNode: (nodeId: string) => void;

  onDuplicateNode: (nodeId: string) => void;
}

const CanvasNodeActionsContext = createContext<CanvasNodeActions | null>(null);

interface CanvasNodeActionsProviderProps {
  value: CanvasNodeActions;
  children: ReactNode;
}

export function CanvasNodeActionsProvider({ value, children }: CanvasNodeActionsProviderProps) {
  return (
    <CanvasNodeActionsContext.Provider value={value}>{children}</CanvasNodeActionsContext.Provider>
  );
}

export function useCanvasNodeActions(): CanvasNodeActions {
  const ctx = useContext(CanvasNodeActionsContext);
  if (!ctx) {
    throw new Error('useCanvasNodeActions must be called inside <CanvasNodeActionsProvider>.');
  }
  return ctx;
}
