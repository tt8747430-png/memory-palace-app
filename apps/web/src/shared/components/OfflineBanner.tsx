'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

/**
 * Renders a subtle banner when the browser is offline.
 * Placed inside the canvas viewport so it doesn't shift the layout.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 backdrop-blur-sm dark:text-amber-400"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      Offline — changes will sync when reconnected
    </div>
  );
}
