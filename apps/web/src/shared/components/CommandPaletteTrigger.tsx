'use client';

import { Search } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { useCommandPalette } from './CommandPaletteContext';

/** Mobile search icon — taps open the command palette.
 *  Render inside the mobile header, hidden on `md+` via `md:hidden`. */
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

/** Desktop search hint shown in the sidebar footer.
 *  Tapping it opens the command palette, same as Cmd+K. */
export function CommandPaletteDesktopTrigger() {
  const { openPalette } = useCommandPalette();

  // Prefer the modern NavigatorUAData API; fall back to the legacy platform
  // string. Both are undefined on the server — suppressHydrationWarning on
  // the <kbd> element handles the intentional server/client mismatch.
  const isMac =
    typeof navigator !== 'undefined' &&
    /mac/i.test(
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
        ?.platform ?? navigator.platform,
    );

  return (
    <button
      onClick={openPalette}
      className="hidden w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      aria-label={`Open command palette (${isMac ? '⌘K' : 'Ctrl+K'})`}
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <span>Search…</span>
      <kbd
        suppressHydrationWarning
        className="ml-auto inline-flex items-center gap-0.5 rounded border px-1 py-0.5 font-mono text-xs"
      >
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </button>
  );
}
