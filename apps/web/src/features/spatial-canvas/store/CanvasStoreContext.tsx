'use client';

import { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { createCanvasStore, type CanvasState, type CanvasStore } from './canvasStore';

const CanvasStoreContext = createContext<CanvasStore | null>(null);

export function CanvasStoreProvider({ children }: { children: React.ReactNode }) {
  // useState factory ensures the store is created once per component mount and
  // garbage-collected when the canvas unmounts — safe under React Compiler.
  const [store] = useState(() => createCanvasStore());

  return <CanvasStoreContext.Provider value={store}>{children}</CanvasStoreContext.Provider>;
}

/** Subscribe to a slice of canvas state. Only re-renders when the selected
 * slice changes — unrelated state updates are invisible to the consumer. */
export function useCanvasStore<T>(selector: (state: CanvasState) => T): T {
  const store = useContext(CanvasStoreContext);
  if (!store) {
    throw new Error('useCanvasStore must be called inside <CanvasStoreProvider>.');
  }
  return useStore(store, selector);
}

/** Returns the raw Zustand store for imperative reads (`getState()`) and
 * writes (`setState()`) without creating a reactive subscription. Use this
 * when you need to read state inside an event handler without causing the
 * component to re-render on every state change. */
export function useCanvasStoreApi(): CanvasStore {
  const store = useContext(CanvasStoreContext);
  if (!store) {
    throw new Error('useCanvasStoreApi must be called inside <CanvasStoreProvider>.');
  }
  return store;
}
