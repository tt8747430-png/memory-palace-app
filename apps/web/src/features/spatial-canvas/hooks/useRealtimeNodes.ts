'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSupabaseBrowser } from '@/shared/lib/supabase-browser';
import { roomNodesQueryKey } from './useNodesQuery';

/**
 * Subscribes to Supabase Realtime Postgres Changes on the `nodes` table,
 * filtered by `room_id`. When a change is detected (INSERT, UPDATE, DELETE),
 * it invalidates the TanStack Query cache for that room's nodes, triggering
 * a background refetch.
 *
 * This is Layer 2 of Phase 5C's sync strategy — cross-device sync via
 * Postgres WAL → Supabase Realtime → WebSocket → cache invalidation.
 *
 * The hook is idempotent: multiple mounts with the same roomId share the
 * same Supabase client singleton. The channel is unsubscribed on unmount.
 *
 * @see docs/adr/5c-realtime-sync.md
 */
export function useRealtimeNodes(roomId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const queryKey = roomNodesQueryKey(roomId);

    const channel = supabase
      .channel(`room-nodes:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // A change was detected on the nodes table for this room.
          // Invalidate the cache — TanStack Query will refetch in the background.
          // We don't use the payload directly because:
          // 1. The payload may not include all columns (RLS/publication config)
          // 2. Our SelectNode type is already well-defined
          // 3. invalidateQueries is idempotent and cheap
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
}
