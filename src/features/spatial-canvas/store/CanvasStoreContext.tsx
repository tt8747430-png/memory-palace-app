'use client';

import { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { createCanvasStore, type CanvasState, type CanvasStore } from './canvasStore';

const CanvasStoreContext = createContext<CanvasStore | null>(null);

export function CanvasStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createCanvasStore());

  return <CanvasStoreContext.Provider value={store}>{children}</CanvasStoreContext.Provider>;
}

export function useCanvasStore<T>(selector: (state: CanvasState) => T): T {
  const store = useContext(CanvasStoreContext);
  if (!store) {
    throw new Error('useCanvasStore must be called inside <CanvasStoreProvider>.');
  }
  return useStore(store, selector);
}

export function useCanvasStoreApi(): CanvasStore {
  const store = useContext(CanvasStoreContext);
  if (!store) {
    throw new Error('useCanvasStoreApi must be called inside <CanvasStoreProvider>.');
  }
  return store;
}
