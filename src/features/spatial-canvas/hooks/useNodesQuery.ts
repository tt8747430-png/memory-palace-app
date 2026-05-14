'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { SelectNode } from '@/db';
import { getRoomNodes } from '@/features/nodes';

export const roomNodesQueryKey = (roomId: string) => ['rooms', roomId, 'nodes'] as const;

type Options = Omit<UseQueryOptions<SelectNode[], Error>, 'queryKey' | 'queryFn'>;

export function useNodesQuery(roomId: string, options?: Options) {
  return useQuery<SelectNode[], Error>({
    queryKey: roomNodesQueryKey(roomId),
    queryFn: async () => {
      const result = await getRoomNodes({ roomId });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 30_000,
    ...options,
  });
}
