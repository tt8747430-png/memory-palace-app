'use client';

import { type ReactNode } from 'react';
import { CommandPaletteProvider } from './CommandPaletteContext';
import { ShortcutsOverlayProvider } from './ShortcutsOverlayContext';
import { AppDialogProvider } from './AppDialogContext';
import { CommandPalette } from './CommandPalette';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';

function GlobalShortcutsMount() {
  useGlobalShortcuts();
  return null;
}

export function AppCommandProvider({ children }: { children: ReactNode }) {
  return (
    <ShortcutsOverlayProvider>
      <CommandPaletteProvider>
        <AppDialogProvider>
          <GlobalShortcutsMount />
          {children}
          <CommandPalette />
          <ShortcutsOverlay />
        </AppDialogProvider>
      </CommandPaletteProvider>
    </ShortcutsOverlayProvider>
  );
}
