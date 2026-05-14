'use client';

import { useSyncExternalStore } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/ui';
import { useCommandPalette } from '@/shared/components/CommandPaletteContext';

const noopSubscribe = () => () => {};
function readIsMac(): boolean {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform;
  return /mac/i.test(platform);
}

export function QuickActionsRow() {
  const { openPalette } = useCommandPalette();
  const isMac = useSyncExternalStore(noopSubscribe, readIsMac, () => false);

  return (
    <button
      type="button"
      onClick={openPalette}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/40',
        'px-3 py-2 text-sm text-muted-foreground transition-colors',
        'hover:border-border hover:bg-muted/60 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      aria-label={`Quick actions (${isMac ? '⌘K' : 'Ctrl+K'})`}
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">Quick actions</span>
      <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[0.65rem]">
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </button>
  );
}
