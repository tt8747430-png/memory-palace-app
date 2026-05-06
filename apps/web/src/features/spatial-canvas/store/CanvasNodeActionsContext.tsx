'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface CanvasNodeActions {
  /** Open the node editor sheet for the given node ID. */
  onEditNode: (nodeId: string) => void;
  /** Delete the given node (optimistic, with rollback). */
  onDeleteNode: (nodeId: string) => void;
  /** Duplicate the given node at a +40/+40 offset. */
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

/** Consume the canvas node actions injected by InnerCanvas.
 * Must be called inside <CanvasNodeActionsProvider>. */
export function useCanvasNodeActions(): CanvasNodeActions {
  const ctx = useContext(CanvasNodeActionsContext);
  if (!ctx) {
    throw new Error('useCanvasNodeActions must be called inside <CanvasNodeActionsProvider>.');
  }
  return ctx;
}
