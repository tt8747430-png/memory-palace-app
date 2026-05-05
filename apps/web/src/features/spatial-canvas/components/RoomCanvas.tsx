'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Edge,
  type OnNodeDrag,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { SelectNode } from '@memory-palace/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nodeTypes } from './nodes/nodeTypes';
import type { MemoryNodeType } from './nodes/MemoryNode';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasLoadingSkeleton } from './CanvasLoadingSkeleton';
import { CanvasStoreProvider, useCanvasStore } from '../store/CanvasStoreContext';
import { useNodesQuery, roomNodesQueryKey } from '../hooks/useNodesQuery';
import { updateNodePosition } from '@/features/nodes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dbNodeToFlowNode(node: SelectNode): MemoryNodeType {
  return {
    id: node.id,
    type: 'memoryNode',
    position: { x: node.positionX, y: node.positionY },
    data: {
      title: node.title,
      content: node.content ?? null,
      nodeType: node.nodeType,
      color: node.color ?? null,
    },
  };
}

// ─── Inner canvas (requires ReactFlowProvider in tree) ───────────────────────

interface InnerCanvasProps {
  roomId: string;
  initialNodes: SelectNode[];
}

function InnerCanvas({ roomId, initialNodes }: InnerCanvasProps) {
  const queryClient = useQueryClient();
  const activeTool = useCanvasStore((s) => s.activeTool);
  const hydratePositions = useCanvasStore((s) => s.hydratePositions);
  const setPosition = useCanvasStore((s) => s.setPosition);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);

  const { data: serverNodes, isLoading } = useNodesQuery(roomId, {
    initialData: initialNodes,
  });

  const flowNodes = useMemo(() => (serverNodes ?? []).map(dbNodeToFlowNode), [serverNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState<MemoryNodeType>(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState<Edge>([]);

  // Sync local React Flow state when TanStack Query cache changes.
  useEffect(() => {
    setNodes(flowNodes);
    hydratePositions(flowNodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })));
  }, [flowNodes, setNodes, hydratePositions]);

  // ── Drag persistence (optimistic) ────────────────────────────────────────
  const positionMutation = useMutation({
    mutationFn: async (vars: { id: string; x: number; y: number }) => {
      const result = await updateNodePosition({
        id: vars.id,
        roomId,
        positionX: vars.x,
        positionY: vars.y,
      });
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: roomNodesQueryKey(roomId) });
      const snapshot = queryClient.getQueryData<SelectNode[]>(roomNodesQueryKey(roomId));
      queryClient.setQueryData<SelectNode[]>(roomNodesQueryKey(roomId), (old) =>
        old?.map((n) => (n.id === vars.id ? { ...n, positionX: vars.x, positionY: vars.y } : n)),
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(roomNodesQueryKey(roomId), ctx.snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roomNodesQueryKey(roomId) });
    },
  });

  const onNodeDragStop: OnNodeDrag<MemoryNodeType> = useCallback(
    (_event, node) => {
      setPosition(node.id, node.position.x, node.position.y);
      positionMutation.mutate({ id: node.id, x: node.position.x, y: node.position.y });
    },
    [setPosition, positionMutation],
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selected }) => {
      setSelectedNodeIds(new Set(selected.map((n) => n.id)));
    },
    [setSelectedNodeIds],
  );

  if (isLoading) return <CanvasLoadingSkeleton />;

  const isPanMode = activeTool === 'pan';

  return (
    <div className="relative h-full w-full" data-testid="canvas-container">
      <ReactFlow<MemoryNodeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        nodesDraggable={!isPanMode}
        panOnDrag={isPanMode ? true : [1, 2]}
        zoomOnPinch
        zoomOnScroll={false}
        preventScrolling
        onlyRenderVisibleElements
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodeExtent={[
          [-5000, -5000],
          [5000, 5000],
        ]}
        fitView={nodes.length > 0}
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        className="rounded-xl"
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
        <Controls className="hidden md:flex" showInteractive={false} />
        <MiniMap<MemoryNodeType>
          className="hidden md:block"
          nodeColor={(n) => n.data.color ?? 'hsl(var(--muted-foreground))'}
          maskColor="hsl(var(--background)/0.8)"
          pannable
          zoomable
        />
      </ReactFlow>

      <CanvasToolbar />
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface RoomCanvasProps {
  roomId: string;
  /** Server-side fetched nodes passed as TanStack Query initialData. */
  initialNodes: SelectNode[];
}

/** Full canvas for a room — wraps ReactFlowProvider, CanvasStoreProvider,
 * TanStack Query hooks, and the canvas error boundary in a clean public API. */
export function RoomCanvas({ roomId, initialNodes }: RoomCanvasProps) {
  return (
    <CanvasStoreProvider>
      <ReactFlowProvider>
        <InnerCanvas roomId={roomId} initialNodes={initialNodes} />
      </ReactFlowProvider>
    </CanvasStoreProvider>
  );
}

// Re-export for convenience in page imports.
export type { MemoryNodeData, MemoryNodeType } from './nodes/MemoryNode';
