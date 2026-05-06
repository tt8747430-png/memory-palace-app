'use client';

import { type ReactNode } from 'react';
import { CommandPaletteProvider } from './CommandPaletteContext';
import { ShortcutsOverlayProvider } from './ShortcutsOverlayContext';
import { CommandPalette } from './CommandPalette';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';

/** Inner component — placed inside both providers so it can call both context hooks. */
function GlobalShortcutsMount() {
  useGlobalShortcuts();
  return null;
}

/**
 * Composes CommandPaletteProvider + ShortcutsOverlayProvider, renders both
 * overlay dialogs, and mounts global keyboard shortcuts.
 *
 * Wrap the DashboardShell (or root layout) with this component once.
 */
export function AppCommandProvider({ children }: { children: ReactNode }) {
  return (
    <ShortcutsOverlayProvider>
      <CommandPaletteProvider>
        <GlobalShortcutsMount />
        {children}
        <CommandPalette />
        <ShortcutsOverlay />
      </CommandPaletteProvider>
    </ShortcutsOverlayProvider>
  );
}
