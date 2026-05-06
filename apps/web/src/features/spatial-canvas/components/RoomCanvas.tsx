'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  SelectionMode,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type OnNodeDrag,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { SelectNode } from '@memory-palace/db';
import { nodeTypes } from './nodes/nodeTypes';
import type { MemoryNodeType } from './nodes/MemoryNode';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasFab } from './CanvasFab';
import { CanvasLoadingSkeleton } from './CanvasLoadingSkeleton';
import { NodeEditorSheet } from './NodeEditorSheet';
import { SelectionToolbar } from './SelectionToolbar';
import { CanvasStoreProvider, useCanvasStore } from '../store/CanvasStoreContext';
import { CanvasNodeActionsProvider } from '../store/CanvasNodeActionsContext';
import { useNodesQuery } from '../hooks/useNodesQuery';
import { useRealtimeNodes } from '../hooks/useRealtimeNodes';
import { useRoomNodeMutations, type PositionUpdate } from '../hooks/useRoomNodeMutations';
import { OfflineBanner } from '@/shared/components/OfflineBanner';

const SNAP_GRID: [number, number] = [20, 20];

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

// ─── Pane context menu ────────────────────────────────────────────────────────

interface PaneMenu {
  /** Screen-space coordinates for the menu's top-left anchor. */
  screenX: number;
  screenY: number;
  /** Canvas-space coordinates used to place a new node. */
  flowX: number;
  flowY: number;
}

interface PaneContextMenuProps {
  menu: PaneMenu;
  roomId: string;
  onClose: () => void;
}

function PaneContextMenu({ menu, roomId, onClose }: PaneContextMenuProps) {
  const { addNode } = useRoomNodeMutations(roomId);
  const { fitView } = useReactFlow();
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, { capture: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer, { capture: true });
    };
  }, [onClose]);

  const handleAddHere = () => {
    addNode.mutate({
      roomId,
      title: 'New Node',
      nodeType: 'text',
      positionX: Math.round(menu.flowX),
      positionY: Math.round(menu.flowY),
    });
    onClose();
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Canvas actions"
      style={{ top: menu.screenY, left: menu.screenX }}
      className="absolute z-50 min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md"
    >
      <button
        role="menuitem"
        type="button"
        onClick={handleAddHere}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground"
      >
        Add node here
      </button>
      <div className="-mx-1 my-1 h-px bg-border" />
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          fitView({ padding: 0.2, duration: 300 });
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground"
      >
        Fit view
      </button>
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          toggleSnap();
          onClose();
        }}
        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground"
      >
        Snap to grid
        <span className="text-xs text-muted-foreground">{snapEnabled ? 'on' : 'off'}</span>
      </button>
    </div>
  );
}

// ─── Inner canvas (requires ReactFlowProvider in tree) ───────────────────────

interface InnerCanvasProps {
  roomId: string;
  initialNodes: SelectNode[];
}

function InnerCanvas({ roomId, initialNodes }: InnerCanvasProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);
  const setEditingNodeId = useCanvasStore((s) => s.setEditingNodeId);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);

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

  const { savePosition, saveBatchPositions, removeNode } = useRoomNodeMutations(roomId);
  const { screenToFlowPosition } = useReactFlow();

  // Layer 2: Subscribe to Supabase Realtime for cross-device sync.
  useRealtimeNodes(roomId);

  // ── Keyboard shortcut: G = toggle snap ─────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip when the user is typing in an input field.
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'g' || e.key === 'G') toggleSnap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSnap]);

  // Single-node drag — fires only when the dragged node is NOT part of a
  // multi-selection (React Flow v12 routes selection drags to onSelectionDragStop).
  const onNodeDragStop: OnNodeDrag<MemoryNodeType> = (_event, node) => {
    savePosition.mutate({
      id: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    });
  };

  // Multi-select drag — atomic batch save.
  const onSelectionDragStop = (_event: React.MouseEvent, dragged: MemoryNodeType[]) => {
    if (dragged.length === 0) return;
    const updates: PositionUpdate[] = dragged.map((n) => ({
      id: n.id,
      positionX: n.position.x,
      positionY: n.position.y,
    }));
    if (updates.length === 1) {
      savePosition.mutate(updates[0]);
    } else {
      saveBatchPositions.mutate(updates);
    }
  };

  const onSelectionChange: OnSelectionChangeFunc = ({ nodes: selected }) => {
    setSelectedNodeIds(new Set(selected.map((n) => n.id)));
  };

  // ── Pane context menu ─────────────────────────────────────────────────────
  const [paneMenu, setPaneMenu] = useState<PaneMenu | null>(null);

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const container = document.querySelector('[data-testid="canvas-container"]');
      const containerRect = container?.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;
      const offsetX = containerRect ? clientX - containerRect.left : clientX;
      const offsetY = containerRect ? clientY - containerRect.top : clientY;
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
      setPaneMenu({ screenX: offsetX, screenY: offsetY, flowX: flowPos.x, flowY: flowPos.y });
    },
    [screenToFlowPosition],
  );

  // ── Node actions (injected into MemoryNode via context) ───────────────────
  const nodeActions = useMemo(
    () => ({
      onEditNode: (nodeId: string) => setEditingNodeId(nodeId),
      onDeleteNode: (nodeId: string) => removeNode.mutate({ id: nodeId }),
    }),
    [setEditingNodeId, removeNode],
  );

  if (isLoading) return <CanvasLoadingSkeleton />;

  const isPanMode = activeTool === 'pan';
  const fitView = initialNodes.length > 0;

  return (
    <CanvasNodeActionsProvider value={nodeActions}>
      <div
        className="relative h-full w-full"
        data-testid="canvas-container"
        // Close pane menu on any pointer down inside the canvas container
        onPointerDown={() => paneMenu && setPaneMenu(null)}
      >
        <ReactFlow<MemoryNodeType>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onSelectionDragStop={onSelectionDragStop}
          onSelectionChange={onSelectionChange}
          onPaneContextMenu={onPaneContextMenu}
          nodesDraggable={!isPanMode}
          panOnDrag={isPanMode ? true : [1, 2]}
          selectionOnDrag={!isPanMode}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Meta', 'Shift']}
          snapToGrid={snapEnabled}
          snapGrid={SNAP_GRID}
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

        <SelectionToolbar roomId={roomId} />
        <CanvasToolbar roomId={roomId} />
        <CanvasFab roomId={roomId} />
        <NodeEditorSheet roomId={roomId} />
        <OfflineBanner />

        {paneMenu && (
          <PaneContextMenu menu={paneMenu} roomId={roomId} onClose={() => setPaneMenu(null)} />
        )}
      </div>
    </CanvasNodeActionsProvider>
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
