'use client';

import { createContext, useContext } from 'react';

export interface CanvasNodeActions {
  /** Open the node editor sheet for the given node ID. */
  onEditNode: (nodeId: string) => void;
  /** Delete the given node (optimistic, with rollback). */
  onDeleteNode: (nodeId: string) => void;
}

const CanvasNodeActionsContext = createContext<CanvasNodeActions | null>(null);

export const CanvasNodeActionsProvider = CanvasNodeActionsContext.Provider;

/** Consume the canvas node actions injected by InnerCanvas.
 * Must be called inside <CanvasNodeActionsProvider>. */
export function useCanvasNodeActions(): CanvasNodeActions {
  const ctx = useContext(CanvasNodeActionsContext);
  if (!ctx) {
    throw new Error('useCanvasNodeActions must be called inside <CanvasNodeActionsProvider>.');
  }
  return ctx;
}
