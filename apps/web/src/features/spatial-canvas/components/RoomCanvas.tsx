'use client';

import { createPortal } from 'react-dom';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  type EdgeChange,
  type OnConnect,
  type OnNodeDrag,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { PalaceMode, SelectEdge, SelectNode } from '@memory-palace/db';
import { nodeTypes } from './nodes/nodeTypes';
import type { MemoryNodeType } from './nodes/MemoryNode';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasFab } from './CanvasFab';
import { CanvasLoadingSkeleton } from './CanvasLoadingSkeleton';
import { NodeEditorSheet } from './NodeEditorSheet';
import { SelectionToolbar } from './SelectionToolbar';
import { CanvasSearch } from './CanvasSearch';
import { CanvasDragAnnouncer, useCanvasDragAnnouncer } from './CanvasDragAnnouncer';
import {
  CanvasStoreProvider,
  useCanvasStore,
  useCanvasStoreApi,
} from '../store/CanvasStoreContext';
import { CanvasNodeActionsProvider } from '../store/CanvasNodeActionsContext';
import { useNodesQuery } from '../hooks/useNodesQuery';
import { useEdgesQuery } from '../hooks/useEdgesQuery';
import { useRealtimeNodes } from '../hooks/useRealtimeNodes';
import { useRoomNodeMutations, type PositionUpdate } from '../hooks/useRoomNodeMutations';
import { useRoomEdgeMutations } from '../hooks/useRoomEdgeMutations';
import { getCanvasCenterFlowPos, snapPosition } from '../lib/canvasUtils';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { CANVAS_EVENTS } from '@/shared/lib/canvasEvents';

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
  palaceMode: PalaceMode;
}

function InnerCanvas({ roomId, initialNodes, palaceMode }: InnerCanvasProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const setEditingNodeId = useCanvasStore((s) => s.setEditingNodeId);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const pushPositionHistory = useCanvasStore((s) => s.pushPositionHistory);
  const undoPositions = useCanvasStore((s) => s.undoPositions);
  const redoPositions = useCanvasStore((s) => s.redoPositions);
  const clearFuture = useCanvasStore((s) => s.clearFuture);
  const canvasSearchQuery = useCanvasStore((s) => s.canvasSearchQuery);
  // Non-reactive store access for event handlers — avoids re-rendering
  // InnerCanvas on every selection change (which would create new array props
  // like panOnDrag=[1,2] on every render and trigger a React Flow render loop).
  const canvasStoreApi = useCanvasStoreApi();

  const { data: serverNodes, isLoading } = useNodesQuery(roomId, {
    initialData: initialNodes,
  });

  const flowNodes = (serverNodes ?? []).map(dbNodeToFlowNode);

  const [nodes, setNodes, onNodesChange] = useNodesState<MemoryNodeType>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Reconcile React Flow's local state when TanStack Query's cache identity
  // changes (i.e. after invalidateQueries resolves with server-confirmed data).
  // Uses React 19's "adjust state during render" pattern — no useEffect, no
  // extra render cycle, and no viewport-snapping during active drags.
  const [prevServerNodes, setPrevServerNodes] = useState(serverNodes);
  if (prevServerNodes !== serverNodes) {
    setPrevServerNodes(serverNodes);
    setNodes(flowNodes);
  }

  const { data: serverEdges = [] } = useEdgesQuery(roomId);
  const { addEdge: addEdgeMutation, removeEdge: removeEdgeMutation } = useRoomEdgeMutations(roomId);

  const serverEdgeToFlow = (e: SelectEdge): Edge => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    ...(e.label ? { label: e.label } : {}),
  });

  const [prevServerEdges, setPrevServerEdges] = useState(serverEdges);
  if (prevServerEdges !== serverEdges) {
    setPrevServerEdges(serverEdges);
    setEdges(serverEdges.map(serverEdgeToFlow));
  }

  const { savePosition, saveBatchPositions, addNode, removeNode, duplicateNodes } =
    useRoomNodeMutations(roomId);
  const { screenToFlowPosition, fitView, getNodes } = useReactFlow();

  // Refs to avoid stale closures in effects that cannot list frequently-
  // changing values as deps (removeNode.mutate changes each render from TQ;
  // activeTool changes on every tool switch).
  const activeToolRef = useRef(activeTool);
  const removeNodeMutateRef = useRef(removeNode.mutate);
  const duplicateNodesMutateRef = useRef(duplicateNodes.mutate);
  useLayoutEffect(() => {
    activeToolRef.current = activeTool;
    removeNodeMutateRef.current = removeNode.mutate;
    duplicateNodesMutateRef.current = duplicateNodes.mutate;
  });

  // Layer 2: Subscribe to Supabase Realtime for cross-device sync.
  useRealtimeNodes(roomId);

  // Screen reader announcements for drag operations.
  const { announcerRef, announce } = useCanvasDragAnnouncer();

  const applyPositionSnapshot = useCallback(
    (snapshot: { id: string; x: number; y: number }[]) => {
      const posMap = new Map(snapshot.map((p) => [p.id, p]));
      setNodes((prev) =>
        prev.map((n) => {
          const snap = posMap.get(n.id);
          return snap ? { ...n, position: { x: snap.x, y: snap.y } } : n;
        }),
      );
      const updates = snapshot.map((p) => ({ id: p.id, positionX: p.x, positionY: p.y }));
      if (updates.length > 1) saveBatchPositions.mutate(updates);
      else if (updates.length === 1) savePosition.mutate(updates[0]);
    },
    [setNodes, saveBatchPositions, savePosition],
  );

  // ── canvas:create-node event (fired by the command palette / C→N shortcut) ──
  useEffect(() => {
    const onCreate = () => {
      const position = getCanvasCenterFlowPos(screenToFlowPosition);
      // Read snapEnabled imperatively to avoid stale closure (snapEnabled is not
      // in this effect's deps — canvasStoreApi is stable and always current).
      const { snapEnabled: snap } = canvasStoreApi.getState();
      addNode.mutate({
        roomId,
        title: 'New Node',
        nodeType: 'text',
        positionX: snapPosition(position.x, SNAP_GRID[0], snap),
        positionY: snapPosition(position.y, SNAP_GRID[1], snap),
      });
    };
    window.addEventListener(CANVAS_EVENTS.CREATE_NODE, onCreate);
    return () => window.removeEventListener(CANVAS_EVENTS.CREATE_NODE, onCreate);
  }, [addNode, canvasStoreApi, roomId, screenToFlowPosition]);

  // ── canvas:fit-view / canvas:toggle-snap (fired by the command palette) ──
  useEffect(() => {
    const onFitView = () => fitView({ padding: 0.2, duration: 300 });
    const onToggleSnap = () => toggleSnap();
    window.addEventListener(CANVAS_EVENTS.FIT_VIEW, onFitView);
    window.addEventListener(CANVAS_EVENTS.TOGGLE_SNAP, onToggleSnap);
    return () => {
      window.removeEventListener(CANVAS_EVENTS.FIT_VIEW, onFitView);
      window.removeEventListener(CANVAS_EVENTS.TOGGLE_SNAP, onToggleSnap);
    };
  }, [fitView, toggleSnap]);

  // ── canvas:duplicate-node / canvas:delete-node / canvas:undo / canvas:redo ──
  useEffect(() => {
    const onDuplicate = () => {
      const { selectedNodeIds } = canvasStoreApi.getState();
      if (selectedNodeIds.size === 0) return;
      const currentNodes = getNodes() as MemoryNodeType[];
      const selected = currentNodes.filter((n) => selectedNodeIds.has(n.id));
      if (selected.length === 0) return;
      duplicateNodesMutateRef.current(
        selected.map((n) => ({
          id: n.id,
          title: n.data.title,
          content: n.data.content,
          nodeType: n.data.nodeType,
          positionX: n.position.x,
          positionY: n.position.y,
          color: n.data.color,
        })),
      );
      clearFuture();
    };
    const onDeleteSelected = () => {
      const { selectedNodeIds, setSelectedNodeIds } = canvasStoreApi.getState();
      if (selectedNodeIds.size === 0) return;
      for (const id of selectedNodeIds) {
        removeNodeMutateRef.current({ id });
      }
      setSelectedNodeIds(new Set());
      clearFuture();
    };
    const onUndo = () => {
      const current = (getNodes() as MemoryNodeType[]).map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
      }));
      const snapshot = undoPositions(current);
      if (snapshot) applyPositionSnapshot(snapshot);
    };
    const onRedo = () => {
      const current = (getNodes() as MemoryNodeType[]).map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
      }));
      const snapshot = redoPositions(current);
      if (snapshot) applyPositionSnapshot(snapshot);
    };
    window.addEventListener(CANVAS_EVENTS.DUPLICATE_NODE, onDuplicate);
    window.addEventListener(CANVAS_EVENTS.DELETE_NODE, onDeleteSelected);
    window.addEventListener(CANVAS_EVENTS.UNDO, onUndo);
    window.addEventListener(CANVAS_EVENTS.REDO, onRedo);
    return () => {
      window.removeEventListener(CANVAS_EVENTS.DUPLICATE_NODE, onDuplicate);
      window.removeEventListener(CANVAS_EVENTS.DELETE_NODE, onDeleteSelected);
      window.removeEventListener(CANVAS_EVENTS.UNDO, onUndo);
      window.removeEventListener(CANVAS_EVENTS.REDO, onRedo);
    };
  }, [canvasStoreApi, getNodes, clearFuture, applyPositionSnapshot, undoPositions, redoPositions]);

  // ── Refit viewport when the canvas container resizes ─────────────────────
  // Triggers on device rotation, browser-chrome show/hide (iOS URL bar), and
  // sidebar toggles. Skip while the user is actively dragging a node so we
  // don't yank their cursor to a different flow position mid-gesture.
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      if (isDraggingRef.current) return;
      // Debounce: rapid-fire entries during rotation animations.
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fitView({ padding: 0.2, duration: 200, maxZoom: 1.5 });
      }, 120);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fitView]);

  // ── Keyboard shortcuts: G = snap, F = fit view, Del/Backspace = delete,
  //    Cmd+A = select all, Cmd+D = duplicate, Cmd+Z/Shift+Z = undo/redo,
  //    E = open editor for single selected node ─────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === 'g' || e.key === 'G') {
        // Consume the event in capture phase so the global bubble-phase
        // shortcut handler does not arm its 'g → h/p/s' prefix window.
        e.stopPropagation();
        toggleSnap();
      } else if (e.key === 'f' || e.key === 'F') {
        fitView({ padding: 0.2, duration: 300 });
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
        const { selectedNodeIds, setSelectedNodeIds } = canvasStoreApi.getState();
        if (selectedNodeIds.size === 0) return;
        e.preventDefault();
        for (const id of selectedNodeIds) {
          removeNodeMutateRef.current({ id });
        }
        setSelectedNodeIds(new Set());
        clearFuture();
      } else if (mod && (e.key === 'a' || e.key === 'A')) {
        // ── Cmd/Ctrl+A — select all nodes ──────────────────────────────────
        e.preventDefault();
        const currentNodes = getNodes() as MemoryNodeType[];
        const allIds = new Set(currentNodes.map((n) => n.id));
        canvasStoreApi.getState().setSelectedNodeIds(allIds);
        setNodes((prev) => prev.map((n) => ({ ...n, selected: true })));
      } else if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        // ── Cmd/Ctrl+Z — undo position change ──────────────────────────────
        e.preventDefault();
        const current = (getNodes() as MemoryNodeType[]).map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
        }));
        const snapshot = undoPositions(current);
        if (snapshot) applyPositionSnapshot(snapshot);
      } else if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        // ── Cmd/Ctrl+Shift+Z — redo position change ─────────────────────────
        e.preventDefault();
        const current = (getNodes() as MemoryNodeType[]).map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
        }));
        const snapshot = redoPositions(current);
        if (snapshot) applyPositionSnapshot(snapshot);
      } else if (mod && (e.key === 'd' || e.key === 'D')) {
        // ── Cmd/Ctrl+D — duplicate selected nodes ──────────────────────────
        e.preventDefault();
        const { selectedNodeIds } = canvasStoreApi.getState();
        if (selectedNodeIds.size === 0) return;
        const currentNodes = getNodes() as MemoryNodeType[];
        const selected = currentNodes.filter((n) => selectedNodeIds.has(n.id));
        if (selected.length === 0) return;
        duplicateNodesMutateRef.current(
          selected.map((n) => ({
            id: n.id,
            title: n.data.title,
            content: n.data.content,
            nodeType: n.data.nodeType,
            positionX: n.position.x,
            positionY: n.position.y,
            color: n.data.color,
          })),
        );
        clearFuture();
      } else if ((e.key === 'e' || e.key === 'E') && !mod) {
        // ── E — open editor for the single selected node ────────────────────
        const { selectedNodeIds, setEditingNodeId: storeSetEditingNodeId } =
          canvasStoreApi.getState();
        if (selectedNodeIds.size !== 1) return;
        const [nodeId] = selectedNodeIds;
        storeSetEditingNodeId(nodeId);
      }
    };
    // Capture phase runs before the global document bubble-phase listener,
    // which makes stopPropagation() effective for preventing prefix arming.
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [
    toggleSnap,
    fitView,
    canvasStoreApi,
    getNodes,
    setNodes,
    applyPositionSnapshot,
    undoPositions,
    redoPositions,
    clearFuture,
  ]);

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

  // Capture positions BEFORE a drag so we have a valid undo snapshot.
  const onNodeDragStart: OnNodeDrag<MemoryNodeType> = (_event, node) => {
    isDraggingRef.current = true;
    const snap = (getNodes() as MemoryNodeType[]).map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));
    pushPositionHistory(snap);
    announce(`Moving ${node.data.title}`);
  };

  // Single-node drag — fires only when the dragged node is NOT part of a
  // multi-selection (React Flow v12 routes selection drags to onSelectionDragStop).
  const onNodeDragStop: OnNodeDrag<MemoryNodeType> = (_event, node) => {
    isDraggingRef.current = false;
    savePosition.mutate({
      id: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    });
    announce(`${node.data.title} placed`);
  };

  // Selected-node drag — fires when dragging one or more selected nodes.
  // For a single selected node, delegates to savePosition; for multiple, uses
  // the atomic batch mutation to persist all positions in one transaction.
  const onSelectionDragStop = (_event: React.MouseEvent, dragged: MemoryNodeType[]) => {
    isDraggingRef.current = false;
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

  // ── Edge creation — fired when the user drags from one handle to another ──
  const onConnect: OnConnect = (connection) => {
    if (!connection.source || !connection.target) return;
    addEdgeMutation.mutate({
      sourceNodeId: connection.source,
      targetNodeId: connection.target,
    });
  };

  // Handle edge deletions (selected edge + Delete key).
  const handleEdgesChange = (changes: EdgeChange[]) => {
    onEdgesChange(changes);
    for (const change of changes) {
      if (change.type === 'remove') {
        removeEdgeMutation.mutate({ id: change.id });
      }
    }
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
      positionX: snapPosition(paneMenu.flowX, SNAP_GRID[0], snapEnabled),
      positionY: snapPosition(paneMenu.flowY, SNAP_GRID[1], snapEnabled),
    });
    setPaneMenu(null);
  };

  // ── Node actions (injected into MemoryNode via context) ───────────────────
  const nodeActions = {
    onEditNode: (nodeId: string) => setEditingNodeId(nodeId),
    onDeleteNode: (nodeId: string) => {
      removeNode.mutate({ id: nodeId });
      clearFuture();
    },
    onDuplicateNode: (nodeId: string) => {
      const node = (getNodes() as MemoryNodeType[]).find((n) => n.id === nodeId);
      if (!node) return;
      duplicateNodes.mutate([
        {
          id: node.id,
          title: node.data.title,
          content: node.data.content,
          nodeType: node.data.nodeType,
          positionX: node.position.x,
          positionY: node.position.y,
          color: node.data.color,
        },
      ]);
      clearFuture();
    },
  };

  // Dim nodes that don't match the live search query (opacity only, no unmount).
  // useMemo is required here for two reasons:
  //  1. Avoids restarting CSS opacity transitions on every unrelated re-render
  //     (browsers compare style strings byte-for-byte and restart on change).
  //  2. Preserves node object identity during drag, which keeps React Flow's
  //     snap-to-grid position stream intact when search is active.
  // Must be called before the isLoading early return to satisfy rules-of-hooks.
  const displayNodes = useMemo(() => {
    if (canvasSearchQuery.trim().length === 0) return nodes;
    const q = canvasSearchQuery.toLowerCase();
    return nodes.map((n) => {
      const matches =
        n.data.title.toLowerCase().includes(q) ||
        (n.data.content?.toLowerCase().includes(q) ?? false);
      return matches
        ? n
        : { ...n, style: { ...n.style, opacity: 0.2, transition: 'opacity 150ms' } };
    });
  }, [nodes, canvasSearchQuery]);

  if (isLoading) return <CanvasLoadingSkeleton />;

  const isPanMode = activeTool === 'pan';
  const shouldFitView = initialNodes.length > 0;

  return (
    <CanvasNodeActionsProvider value={nodeActions}>
      <div ref={containerRef} className="relative h-full w-full" data-testid="canvas-container">
        <CanvasDragAnnouncer announcerRef={announcerRef} />
        <ReactFlow<MemoryNodeType>
          nodes={displayNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onSelectionDragStop={onSelectionDragStop}
          onSelectionChange={onSelectionChange}
          onPaneContextMenu={onPaneContextMenu}
          onConnect={onConnect}
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
          aria-label="Memory canvas — use Tab to navigate nodes, Enter to edit, Delete to remove"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
          {/*
           * Lift the built-in zoom/fit controls off the canvas bottom edge
           * so they read as floating affordances instead of sitting flush
           * with the dashboard bottom nav. Inline style is the only API
           * React Flow exposes for repositioning the Controls panel.
           */}
          <Controls
            className="flex md:flex"
            showInteractive={false}
            style={{
              bottom: 'max(1rem, env(safe-area-inset-bottom))',
              left: '1rem',
            }}
          />
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
        <NodeEditorSheet roomId={roomId} palaceMode={palaceMode} />
        <CanvasSearch />
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
  /** Parent palace mode — drives Bible-mode UI gating in the node editor. */
  palaceMode?: PalaceMode;
}

/** Full canvas for a room — wraps ReactFlowProvider, CanvasStoreProvider,
 * TanStack Query hooks, and the canvas error boundary in a clean public API. */
export function RoomCanvas({ roomId, initialNodes, palaceMode = 'simple' }: RoomCanvasProps) {
  return (
    <CanvasStoreProvider>
      <ReactFlowProvider>
        <InnerCanvas roomId={roomId} initialNodes={initialNodes} palaceMode={palaceMode} />
      </ReactFlowProvider>
    </CanvasStoreProvider>
  );
}

// Re-export for convenience in page imports.
export type { MemoryNodeData, MemoryNodeType } from './nodes/MemoryNode';
