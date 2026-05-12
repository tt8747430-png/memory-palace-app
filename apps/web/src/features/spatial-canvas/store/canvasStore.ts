import { createStore } from 'zustand';

export type CanvasTool = 'pointer' | 'pan';

export interface NodePositionSnap {
  id: string;
  x: number;
  y: number;
}

export interface CanvasState {
  selectedNodeIds: ReadonlySet<string>;
  activeTool: CanvasTool;
  setSelectedNodeIds: (ids: ReadonlySet<string>) => void;
  setActiveTool: (tool: CanvasTool) => void;

  snapEnabled: boolean;
  toggleSnap: () => void;

  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;

  historyStack: NodePositionSnap[][];
  futureStack: NodePositionSnap[][];

  pushPositionHistory: (snapshot: NodePositionSnap[]) => void;

  undoPositions: (currentSnapshot: NodePositionSnap[]) => NodePositionSnap[] | null;

  redoPositions: (currentSnapshot: NodePositionSnap[]) => NodePositionSnap[] | null;

  clearFuture: () => void;

  canvasSearchQuery: string;
  setCanvasSearchQuery: (q: string) => void;
}

export type CanvasStore = ReturnType<typeof createCanvasStore>;

export function createCanvasStore() {
  return createStore<CanvasState>()((set, get) => ({
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
      const { historyStack, futureStack } = get();
      if (historyStack.length === 0) return null;
      const stack = [...historyStack];
      const entry = stack.pop()!;
      set({ historyStack: stack, futureStack: [...futureStack, currentSnapshot] });
      return entry;
    },

    redoPositions: (currentSnapshot) => {
      const { historyStack, futureStack } = get();
      if (futureStack.length === 0) return null;
      const future = [...futureStack];
      const entry = future.pop()!;
      set({ futureStack: future, historyStack: [...historyStack, currentSnapshot] });
      return entry;
    },

    clearFuture: () => set({ futureStack: [] }),

    canvasSearchQuery: '',
    setCanvasSearchQuery: (q) => set({ canvasSearchQuery: q }),
  }));
}
