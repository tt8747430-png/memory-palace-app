import { createStore } from 'zustand';

export type CanvasTool = 'pointer' | 'pan';

/** A lightweight position-only snapshot of one node, used by undo/redo. */
export interface NodePositionSnap {
  id: string;
  x: number;
  y: number;
}

export interface CanvasState {
  // ── Canvas UI state ───────────────────────────────────────────────────────
  selectedNodeIds: ReadonlySet<string>;
  activeTool: CanvasTool;
  setSelectedNodeIds: (ids: ReadonlySet<string>) => void;
  setActiveTool: (tool: CanvasTool) => void;

  // ── Snap-to-grid ──────────────────────────────────────────────────────────
  /** Whether snap-to-grid is enabled. Toggled by the `G` key or toolbar button. */
  snapEnabled: boolean;
  toggleSnap: () => void;

  // ── Node editing ──────────────────────────────────────────────────────────
  /** ID of the node currently open in the editor sheet, or null if none. */
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;

  // ── Position undo / redo ──────────────────────────────────────────────────
  /**
   * Stack of canvas-wide position snapshots. Each entry captures the positions
   * of ALL nodes before a drag-stop (or batch drag-stop). Undo pops from here
   * and applies the snapshot; redo pops from futureStack.
   *
   * Create and delete operations clear the future stack (standard behaviour).
   * Deletion snapshots are not tracked here — see docs/adr/5d-advanced-canvas-ux.md.
   */
  historyStack: NodePositionSnap[][];
  futureStack: NodePositionSnap[][];
  /** Push a before-drag snapshot onto the history stack and clear the future. */
  pushPositionHistory: (snapshot: NodePositionSnap[]) => void;
  /** Pop from history → returns the snapshot to restore (null if empty).
   *  The current snapshot (passed in) is pushed onto the future stack. */
  undoPositions: (currentSnapshot: NodePositionSnap[]) => NodePositionSnap[] | null;
  /** Pop from future → returns the snapshot to re-apply (null if empty).
   *  The current snapshot (passed in) is pushed onto the history stack. */
  redoPositions: (currentSnapshot: NodePositionSnap[]) => NodePositionSnap[] | null;
  /** Clear the future stack — call after any create/delete so redo can't
   *  resurface stale position states that reference non-existent nodes. */
  clearFuture: () => void;

  // ── Canvas search / filter ────────────────────────────────────────────────
  /** Current live-filter query on the canvas. Empty string = no filter. */
  canvasSearchQuery: string;
  setCanvasSearchQuery: (q: string) => void;
}

export type CanvasStore = ReturnType<typeof createCanvasStore>;

/** Factory — call once per canvas mount, not at module level.
 * This prevents shared state between concurrent Next.js App Router renders. */
export function createCanvasStore() {
  return createStore<CanvasState>()((set) => ({
    selectedNodeIds: new Set<string>(),
    activeTool: 'pointer' as CanvasTool,

    setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
    setActiveTool: (tool) => set({ activeTool: tool }),

    snapEnabled: false,
    toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

    editingNodeId: null,
    setEditingNodeId: (id) => set({ editingNodeId: id }),

    historyStack: [],
    futureStack: [],

    pushPositionHistory: (snapshot) =>
      set((s) => ({
        historyStack: [...s.historyStack, snapshot],
        futureStack: [],
      })),

    undoPositions: (currentSnapshot) => {
      let result: NodePositionSnap[] | null = null;
      set((s) => {
        if (s.historyStack.length === 0) return s;
        const stack = [...s.historyStack];
        const entry = stack.pop()!;
        result = entry;
        return {
          historyStack: stack,
          futureStack: [...s.futureStack, currentSnapshot],
        };
      });
      return result;
    },

    redoPositions: (currentSnapshot) => {
      let result: NodePositionSnap[] | null = null;
      set((s) => {
        if (s.futureStack.length === 0) return s;
        const future = [...s.futureStack];
        const entry = future.pop()!;
        result = entry;
        return {
          futureStack: future,
          historyStack: [...s.historyStack, currentSnapshot],
        };
      });
      return result;
    },

    clearFuture: () => set({ futureStack: [] }),

    canvasSearchQuery: '',
    setCanvasSearchQuery: (q) => set({ canvasSearchQuery: q }),
  }));
}
