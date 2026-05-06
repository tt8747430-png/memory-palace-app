'use client';

import { useMemo, useState } from 'react';
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
import { nodeTypes } from './nodes/nodeTypes';
import type { MemoryNodeType } from './nodes/MemoryNode';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasLoadingSkeleton } from './CanvasLoadingSkeleton';
import { NodeEditorSheet } from './NodeEditorSheet';
import { CanvasStoreProvider, useCanvasStore } from '../store/CanvasStoreContext';
import { useNodesQuery } from '../hooks/useNodesQuery';
import { useRoomNodeMutations, type PositionUpdate } from '../hooks/useRoomNodeMutations';

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
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);

  const { data: serverNodes, isLoading } = useNodesQuery(roomId, {
    initialData: initialNodes,
  });

  const flowNodes = useMemo(() => (serverNodes ?? []).map(dbNodeToFlowNode), [serverNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState<MemoryNodeType>(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState<Edge>([]);

  // Reconcile React Flow's local state when TanStack Query's cache identity
  // changes (i.e. after invalidateQueries resolves with server-confirmed data).
  // Uses React 19's "adjust state during render" pattern — no useEffect, no
  // extra render cycle, and no viewport-snapping during active drags.
  const [prevServerNodes, setPrevServerNodes] = useState(serverNodes);
  if (prevServerNodes !== serverNodes) {
    setPrevServerNodes(serverNodes);
    setNodes(flowNodes);
  }

  const { savePosition, saveBatchPositions } = useRoomNodeMutations(roomId);

  // Single-node drag — fires only when the dragged node is NOT part of a
  // multi-selection (React Flow v12 routes selection drags to onSelectionDragStop).
  const onNodeDragStop: OnNodeDrag<MemoryNodeType> = (_event, node) => {
    savePosition.mutate({
      id: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    });
  };

  // Multi-select drag — atomic batch save. React Flow passes the moved nodes
  // (not just the active one); every node in the active selection gets the
  // delta applied in-engine before we read positions here.
  const onSelectionDragStop = (_event: React.MouseEvent, dragged: MemoryNodeType[]) => {
    if (dragged.length === 0) return;
    const updates: PositionUpdate[] = dragged.map((n) => ({
      id: n.id,
      positionX: n.position.x,
      positionY: n.position.y,
    }));
    // Single-node "selection" is still cheaper as one row update.
    if (updates.length === 1) {
      savePosition.mutate(updates[0]);
    } else {
      saveBatchPositions.mutate(updates);
    }
  };

  const onSelectionChange: OnSelectionChangeFunc = ({ nodes: selected }) => {
    setSelectedNodeIds(new Set(selected.map((n) => n.id)));
  };

  if (isLoading) return <CanvasLoadingSkeleton />;

  const isPanMode = activeTool === 'pan';

  // Capture fitView intent once at mount from the server-side initial data.
  // A live expression (nodes.length > 0) would re-trigger on every
  // reconciliation cycle, snapping the viewport during optimistic updates.
  const fitView = initialNodes.length > 0;

  return (
    <div className="relative h-full w-full" data-testid="canvas-container">
      <ReactFlow<MemoryNodeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStop={onSelectionDragStop}
        onSelectionChange={onSelectionChange}
        nodesDraggable={!isPanMode}
        panOnDrag={isPanMode ? true : [1, 2]}
        selectionOnDrag={!isPanMode}
        multiSelectionKeyCode={['Meta', 'Shift']}
        zoomOnPinch
        zoomOnScroll={false}
        preventScrolling
        onlyRenderVisibleElements
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodeExtent={[
          [-5000, -5000],
          [5000, 5000],
        ]}
        fitView={fitView}
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

      <CanvasToolbar roomId={roomId} />
      <NodeEditorSheet roomId={roomId} />
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
