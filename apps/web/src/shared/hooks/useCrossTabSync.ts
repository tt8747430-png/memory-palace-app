'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onCrossTabInvalidate } from '@/shared/lib/cross-tab-sync';

/**
 * Listens for cross-tab cache invalidation messages and applies them
 * to this tab's TanStack Query cache.
 *
 * This is Layer 1 of Phase 5C's sync strategy — zero-latency same-device
 * tab sync via the BroadcastChannel API.
 *
 * Mount once per QueryProvider tree (e.g. in the dashboard layout).
 *
 * @see docs/adr/5c-realtime-sync.md
 */
export function useCrossTabSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return onCrossTabInvalidate((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient]);
}
