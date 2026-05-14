'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { SelectEdge } from '@/db';
import { getRoomEdges } from '@/features/nodes';

export const roomEdgesQueryKey = (roomId: string) => ['rooms', roomId, 'edges'] as const;

type Options = Omit<UseQueryOptions<SelectEdge[], Error>, 'queryKey' | 'queryFn'>;

export function useEdgesQuery(roomId: string, options?: Options) {
  return useQuery<SelectEdge[], Error>({
    queryKey: roomEdgesQueryKey(roomId),
    queryFn: async () => {
      const result = await getRoomEdges({ roomId });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 30_000,
    ...options,
  });
}
