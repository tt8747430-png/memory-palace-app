'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSupabaseBrowser } from '@/shared/lib/supabase-browser';
import { roomNodesQueryKey } from './useNodesQuery';

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
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
}
