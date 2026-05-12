'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectNode } from '@memory-palace/db';
import {
  updateNodePosition,
  batchUpdateNodePositions,
  updateNode,
  createNode,
  deleteNode,
  type UpdateNodeInput,
  type CreateNodeInput,
} from '@/features/nodes';
import { broadcastInvalidate } from '@/shared/lib/cross-tab-sync';
import { roomNodesQueryKey } from './useNodesQuery';

export interface PositionUpdate {
  id: string;
  positionX: number;
  positionY: number;
}

export type NodePatch = Partial<
  Pick<UpdateNodeInput, 'title' | 'content' | 'nodeType' | 'color' | 'verseHint' | 'bibleRef'>
>;

export function useRoomNodeMutations(roomId: string) {
  const queryClient = useQueryClient();
  const queryKey = roomNodesQueryKey(roomId);

  function applyOptimistic(updater: (nodes: SelectNode[]) => SelectNode[]) {
    const snapshot = queryClient.getQueryData<SelectNode[]>(queryKey);
    queryClient.setQueryData<SelectNode[]>(queryKey, (curr) => (curr ? updater(curr) : curr));
    return snapshot;
  }

  function rollback(snapshot: SelectNode[] | undefined) {
    if (snapshot) queryClient.setQueryData(queryKey, snapshot);
  }

  function invalidate() {
    broadcastInvalidate(queryKey);
    return queryClient.invalidateQueries({ queryKey });
  }

  const savePosition = useMutation({
    mutationFn: async (vars: PositionUpdate) => {
      const result = await updateNodePosition({ ...vars, roomId });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = applyOptimistic((nodes) =>
        nodes.map((n) =>
          n.id === vars.id ? { ...n, positionX: vars.positionX, positionY: vars.positionY } : n,
        ),
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.snapshot),
    onSettled: invalidate,
  });

  const saveBatchPositions = useMutation({
    mutationFn: async (updates: PositionUpdate[]) => {
      const result = await batchUpdateNodePositions({ roomId, updates });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const map = new Map(updates.map((u) => [u.id, u]));
      const snapshot = applyOptimistic((nodes) =>
        nodes.map((n) => {
          const u = map.get(n.id);
          return u ? { ...n, positionX: u.positionX, positionY: u.positionY } : n;
        }),
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.snapshot),
    onSettled: invalidate,
  });

  const patchNode = useMutation({
    mutationFn: async (vars: { id: string } & NodePatch) => {
      const { id, ...patch } = vars;
      const result = await updateNode({ id, roomId, ...patch });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const { id, ...patch } = vars;
      const snapshot = applyOptimistic((nodes) =>
        nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.snapshot),
    onSettled: invalidate,
  });

  const addNode = useMutation({
    mutationFn: async (vars: CreateNodeInput) => {
      const result = await createNode(vars);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });

      const now = new Date();
      const placeholder: SelectNode = {
        id: `optimistic-${Date.now()}`,
        roomId: vars.roomId,
        userId: '',
        title: vars.title,
        content: vars.content ?? null,
        nodeType: vars.nodeType ?? 'text',
        positionX: vars.positionX ?? 0,
        positionY: vars.positionY ?? 0,
        color: vars.color ?? null,
        verseHint: null,
        bibleRef: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      const snapshot = applyOptimistic((nodes) => [...nodes, placeholder]);
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.snapshot),
    onSettled: invalidate,
  });

  const removeNode = useMutation({
    mutationFn: async (vars: { id: string }) => {
      const result = await deleteNode({ id: vars.id, roomId });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = applyOptimistic((nodes) => nodes.filter((n) => n.id !== vars.id));
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.snapshot),
    onSettled: invalidate,
  });

  const duplicateNodes = useMutation({
    mutationFn: async (
      sourceNodes: {
        id: string;
        title: string;
        content: string | null;
        nodeType: SelectNode['nodeType'];
        positionX: number;
        positionY: number;
        color: string | null;
      }[],
    ) => {
      const results = await Promise.all(
        sourceNodes.map((n) =>
          createNode({
            roomId,
            title: n.title,
            content: n.content ?? undefined,
            nodeType: n.nodeType,
            positionX: n.positionX + 40,
            positionY: n.positionY + 40,
            color: n.color ?? undefined,
          }),
        ),
      );
      const failed = results.find((r) => !r.success);
      if (failed && !failed.success) throw new Error(failed.error.message);
      return results
        .filter((r) => r.success)
        .map((r) => (r as { success: true; data: SelectNode }).data);
    },
    onSettled: invalidate,
  });

  return {
    savePosition,
    saveBatchPositions,
    patchNode,
    addNode,
    removeNode,
    duplicateNodes,
  } as const;
}
