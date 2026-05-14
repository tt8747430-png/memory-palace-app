'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectEdge } from '@/db';
import { createEdge, deleteEdge } from '@/features/nodes';
import { broadcastInvalidate } from '@/shared/lib/cross-tab-sync';
import { roomEdgesQueryKey } from './useEdgesQuery';

export function useRoomEdgeMutations(roomId: string) {
  const queryClient = useQueryClient();
  const queryKey = roomEdgesQueryKey(roomId);

  function invalidate() {
    broadcastInvalidate(queryKey);
    return queryClient.invalidateQueries({ queryKey });
  }

  const addEdge = useMutation({
    mutationFn: async (vars: { sourceNodeId: string; targetNodeId: string; label?: string }) => {
      const result = await createEdge({ roomId, ...vars });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<SelectEdge[]>(queryKey);
      const placeholder: SelectEdge = {
        id: `optimistic-edge-${Date.now()}`,
        sourceNodeId: vars.sourceNodeId,
        targetNodeId: vars.targetNodeId,
        label: vars.label ?? null,
        createdAt: new Date(),
      };
      queryClient.setQueryData<SelectEdge[]>(queryKey, (curr) =>
        curr ? [...curr, placeholder] : [placeholder],
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(queryKey, ctx.snapshot);
    },
    onSettled: invalidate,
  });

  const removeEdge = useMutation({
    mutationFn: async (vars: { id: string }) => {
      const result = await deleteEdge({ id: vars.id, roomId });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<SelectEdge[]>(queryKey);
      queryClient.setQueryData<SelectEdge[]>(queryKey, (curr) =>
        curr ? curr.filter((e) => e.id !== vars.id) : curr,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(queryKey, ctx.snapshot);
    },
    onSettled: invalidate,
  });

  return { addEdge, removeEdge } as const;
}
