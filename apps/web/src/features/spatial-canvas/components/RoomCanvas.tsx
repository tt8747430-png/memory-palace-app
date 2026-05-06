'use client';

import { createPortal } from 'react-dom';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
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
import {
  CanvasStoreProvider,
  useCanvasStore,
  useCanvasStoreApi,
} from '../store/CanvasStoreContext';
import { CanvasNodeActionsProvider } from '../store/CanvasNodeActionsContext';
import { useNodesQuery } from '../hooks/useNodesQuery';
import { useRealtimeNodes } from '../hooks/useRealtimeNodes';
import { useRoomNodeMutations, type PositionUpdate } from '../hooks/useRoomNodeMutations';
import { getCanvasCenterFlowPos } from '../lib/canvasUtils';
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
  /** Window-space coordinates — used as `position: fixed` anchor. */
  clientX: number;
  clientY: number;
  /** Canvas-space coordinates used to place a new node. */
  flowX: number;
  flowY: number;
}

interface PaneContextMenuProps {
  menu: PaneMenu;
  snapEnabled: boolean;
  onAddNode: () => void;
  onFitView: () => void;
  onToggleSnap: () => void;
  onClose: () => void;
}

/**
 * Pane-level context menu rendered via a portal so it is never clipped by
 * `overflow: hidden` on the canvas container.
 *
 * Dismisses on Escape or any pointer-down outside the menu element.
 */
function PaneContextMenu({
  menu,
  snapEnabled,
  onAddNode,
  onFitView,
  onToggleSnap,
  onClose,
}: PaneContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  const itemClass =
    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground';

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Canvas actions"
      style={
        {
          '--pane-menu-x': `${menu.clientX}px`,
          '--pane-menu-y': `${menu.clientY}px`,
        } as CSSProperties
      }
      className="fixed top-(--pane-menu-y) left-(--pane-menu-x) z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md"
    >
      <button role="menuitem" type="button" onClick={onAddNode} className={itemClass}>
        Add node here
      </button>
      <div className="-mx-1 my-1 h-px bg-border" />
      <button role="menuitem" type="button" onClick={onFitView} className={itemClass}>
        Fit view
      </button>
      <button
        role="menuitem"
        type="button"
        onClick={onToggleSnap}
        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground"
      >
        Snap to grid
        <span className="text-xs text-muted-foreground">{snapEnabled ? 'on' : 'off'}</span>
      </button>
    </div>,
    document.body,
  );
}

// ─── Inner canvas (requires ReactFlowProvider in tree) ───────────────────────

interface InnerCanvasProps {
  roomId: string;
  initialNodes: SelectNode[];
}

function InnerCanvas({ roomId, initialNodes }: InnerCanvasProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const setEditingNodeId = useCanvasStore((s) => s.setEditingNodeId);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  // Non-reactive store access for event handlers — avoids re-rendering
  // InnerCanvas on every selection change (which would create new array props
  // like panOnDrag=[1,2] on every render and trigger a React Flow render loop).
  const canvasStoreApi = useCanvasStoreApi();

  const { data: serverNodes, isLoading } = useNodesQuery(roomId, {
    initialData: initialNodes,
  });

  const flowNodes = (serverNodes ?? []).map(dbNodeToFlowNode);

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

  const { savePosition, saveBatchPositions, addNode, removeNode } = useRoomNodeMutations(roomId);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Refs to avoid stale closures in effects that cannot list frequently-
  // changing values as deps (removeNode.mutate changes each render from TQ;
  // activeTool changes on every tool switch).
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const removeNodeMutateRef = useRef(removeNode.mutate);
  removeNodeMutateRef.current = removeNode.mutate;

  // Layer 2: Subscribe to Supabase Realtime for cross-device sync.
  useRealtimeNodes(roomId);

  // ── canvas:create-node event (fired by the command palette / C→N shortcut) ──
  useEffect(() => {
    const onCreate = () => {
      const position = getCanvasCenterFlowPos(screenToFlowPosition);
      addNode.mutate({
        roomId,
        title: 'New Node',
        nodeType: 'text',
        positionX: Math.round(position.x),
        positionY: Math.round(position.y),
      });
    };
    window.addEventListener('canvas:create-node', onCreate);
    return () => window.removeEventListener('canvas:create-node', onCreate);
  }, [addNode, roomId, screenToFlowPosition]);

  // ── canvas:fit-view / canvas:toggle-snap (fired by the command palette) ──
  useEffect(() => {
    const onFitView = () => fitView({ padding: 0.2, duration: 300 });
    const onToggleSnap = () => toggleSnap();
    window.addEventListener('canvas:fit-view', onFitView);
    window.addEventListener('canvas:toggle-snap', onToggleSnap);
    return () => {
      window.removeEventListener('canvas:fit-view', onFitView);
      window.removeEventListener('canvas:toggle-snap', onToggleSnap);
    };
  }, [fitView, toggleSnap]);

  // ── Keyboard shortcuts: G = snap, F = fit view, Del/Backspace = delete ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'g' || e.key === 'G') {
        // Consume the event in capture phase so the global bubble-phase
        // shortcut handler does not arm its 'g → h/p/s' prefix window.
        e.stopPropagation();
        toggleSnap();
      } else if (e.key === 'f' || e.key === 'F') {
        fitView({ padding: 0.2, duration: 300 });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedNodeIds, setSelectedNodeIds } = canvasStoreApi.getState();
        if (selectedNodeIds.size === 0) return;
        e.preventDefault();
        for (const id of selectedNodeIds) {
          removeNodeMutateRef.current({ id });
        }
        setSelectedNodeIds(new Set());
      }
    };
    // Capture phase runs before the global document bubble-phase listener,
    // which makes stopPropagation() effective for preventing prefix arming.
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [toggleSnap, fitView, canvasStoreApi]);

  // ── Space hold — temporarily switch to pan mode ───────────────────────────
  useEffect(() => {
    const prevToolRef = { current: activeToolRef.current };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      prevToolRef.current = activeToolRef.current;
      setActiveTool('pan');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      setActiveTool(prevToolRef.current);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [setActiveTool]);

  // Single-node drag — fires only when the dragged node is NOT part of a
  // multi-selection (React Flow v12 routes selection drags to onSelectionDragStop).
  const onNodeDragStop: OnNodeDrag<MemoryNodeType> = (_event, node) => {
    savePosition.mutate({
      id: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    });
  };

  // Selected-node drag — fires when dragging one or more selected nodes.
  // For a single selected node, delegates to savePosition; for multiple, uses
  // the atomic batch mutation to persist all positions in one transaction.
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
    canvasStoreApi.getState().setSelectedNodeIds(new Set(selected.map((n) => n.id)));
  };

  // ── Pane context menu ─────────────────────────────────────────────────────
  const [paneMenu, setPaneMenu] = useState<PaneMenu | null>(null);

  const onPaneContextMenu = (event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setPaneMenu({
      clientX: event.clientX,
      clientY: event.clientY,
      flowX: flowPos.x,
      flowY: flowPos.y,
    });
  };

  const handlePaneAddNode = () => {
    if (!paneMenu) return;
    addNode.mutate({
      roomId,
      title: 'New Node',
      nodeType: 'text',
      positionX: Math.round(paneMenu.flowX),
      positionY: Math.round(paneMenu.flowY),
    });
    setPaneMenu(null);
  };

  // ── Node actions (injected into MemoryNode via context) ───────────────────
  const nodeActions = {
    onEditNode: (nodeId: string) => setEditingNodeId(nodeId),
    onDeleteNode: (nodeId: string) => removeNode.mutate({ id: nodeId }),
  };

  if (isLoading) return <CanvasLoadingSkeleton />;

  const isPanMode = activeTool === 'pan';
  const shouldFitView = initialNodes.length > 0;

  return (
    <CanvasNodeActionsProvider value={nodeActions}>
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
          fitView={shouldFitView}
          fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
          className="rounded-xl"
          deleteKeyCode={null}
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
          <PaneContextMenu
            menu={paneMenu}
            snapEnabled={snapEnabled}
            onAddNode={handlePaneAddNode}
            onFitView={() => {
              fitView({ padding: 0.2, duration: 300 });
              setPaneMenu(null);
            }}
            onToggleSnap={() => {
              toggleSnap();
              setPaneMenu(null);
            }}
            onClose={() => setPaneMenu(null)}
          />
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
