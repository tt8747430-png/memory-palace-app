'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ShortcutsOverlayContextValue {
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  openOverlay: () => void;
}

const ShortcutsOverlayContext = createContext<ShortcutsOverlayContextValue | null>(null);

export function ShortcutsOverlayProvider({ children }: { children: ReactNode }) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  return (
    <ShortcutsOverlayContext.Provider
      value={{ overlayOpen, setOverlayOpen, openOverlay: () => setOverlayOpen(true) }}
    >
      {children}
    </ShortcutsOverlayContext.Provider>
  );
}

export function useShortcutsOverlay(): ShortcutsOverlayContextValue {
  const ctx = useContext(ShortcutsOverlayContext);
  if (!ctx) {
    throw new Error('useShortcutsOverlay must be used inside ShortcutsOverlayProvider');
  }
  return ctx;
}
