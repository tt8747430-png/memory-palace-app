'use client';

import { useSyncExternalStore } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/ui';
import { useCommandPalette } from './CommandPaletteContext';

const noopSubscribe = () => () => {};
function readIsMac(): boolean {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform;
  return /mac/i.test(platform);
}

export function CommandPaletteTrigger() {
  const { openPalette } = useCommandPalette();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full md:hidden"
      aria-label="Open command palette"
      onClick={openPalette}
    >
      <Search className="h-5 w-5" />
    </Button>
  );
}

export function CommandPaletteDesktopTrigger() {
  const { openPalette } = useCommandPalette();

  const isMac = useSyncExternalStore(noopSubscribe, readIsMac, () => false);

  return (
    <button
      type="button"
      onClick={openPalette}
      className="hidden w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      aria-label={`Open command palette (${isMac ? '⌘K' : 'Ctrl+K'})`}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <span>Search…</span>
      <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border px-1 py-0.5 font-mono text-xs">
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </button>
  );
}
