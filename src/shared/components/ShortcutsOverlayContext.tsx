'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ShortcutsOverlayContextValue {
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  openOverlay: () => void;
}

const ShortcutsOverlayContext = createContext<ShortcutsOverlayContextValue | null>(null);

export function ShortcutsOverlayProvider({ children }: { children: ReactNode }) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const openOverlay = useCallback(() => setOverlayOpen(true), []);
  const value = useMemo<ShortcutsOverlayContextValue>(
    () => ({ overlayOpen, setOverlayOpen, openOverlay }),
    [overlayOpen, openOverlay],
  );

  return (
    <ShortcutsOverlayContext.Provider value={value}>{children}</ShortcutsOverlayContext.Provider>
  );
}

export function useShortcutsOverlay(): ShortcutsOverlayContextValue {
  const ctx = useContext(ShortcutsOverlayContext);
  if (!ctx) {
    throw new Error('useShortcutsOverlay must be used inside ShortcutsOverlayProvider');
  }
  return ctx;
}
