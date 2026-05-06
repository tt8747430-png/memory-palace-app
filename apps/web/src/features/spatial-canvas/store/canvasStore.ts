import { createStore } from 'zustand';

export type CanvasTool = 'pointer' | 'pan';

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
  }));
}
