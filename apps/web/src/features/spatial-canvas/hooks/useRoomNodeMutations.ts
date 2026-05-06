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
import { roomNodesQueryKey } from './useNodesQuery';

export interface PositionUpdate {
  id: string;
  positionX: number;
  positionY: number;
}

export type NodePatch = Partial<Pick<UpdateNodeInput, 'title' | 'content' | 'nodeType' | 'color'>>;

/**
 * Single seam for every write that mutates the room's node cache.
 *
 * Each mutation follows the same optimistic protocol:
 *   1. cancelQueries — stop in-flight reads from clobbering our optimistic value
 *   2. snapshot — capture the previous cache state for rollback
 *   3. setQueryData — write the optimistic value
 *   4. onError — restore snapshot
 *   5. onSettled — invalidateQueries so the server reconciles the truth
 */
export function useRoomNodeMutations(roomId: string) {
  const queryClient = useQueryClient();
  const queryKey = roomNodesQueryKey(roomId);

  // React Compiler auto-memoizes these closures — no useCallback needed.
  function applyOptimistic(updater: (nodes: SelectNode[]) => SelectNode[]) {
    const snapshot = queryClient.getQueryData<SelectNode[]>(queryKey);
    queryClient.setQueryData<SelectNode[]>(queryKey, (curr) => (curr ? updater(curr) : curr));
    return snapshot;
  }

  function rollback(snapshot: SelectNode[] | undefined) {
    if (snapshot) queryClient.setQueryData(queryKey, snapshot);
  }

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey });
  }

  // ── Single-node drag persistence ─────────────────────────────────────────
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

  // ── Multi-select drag persistence (atomic) ───────────────────────────────
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

  // ── Editor sheet patch (debounced caller-side) ───────────────────────────
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

  // ── Create node ──────────────────────────────────────────────────────────
  const addNode = useMutation({
    mutationFn: async (vars: CreateNodeInput) => {
      const result = await createNode(vars);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      // Optimistic placeholder — uses a temporary id that gets replaced
      // when onSettled fires invalidateQueries with the server response.
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

  // ── Delete node ──────────────────────────────────────────────────────────
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

  return { savePosition, saveBatchPositions, patchNode, addNode, removeNode } as const;
}
