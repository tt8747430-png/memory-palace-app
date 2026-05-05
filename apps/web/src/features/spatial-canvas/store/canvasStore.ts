import { createStore } from 'zustand';

export type CanvasTool = 'pointer' | 'pan';

export interface NodePosition {
  x: number;
  y: number;
}

export interface CanvasState {
  // ── Transient position buffer ─────────────────────────────────────────────
  // Positions here are the local truth during an active drag. On drag-stop
  // they are flushed to TanStack Query's mutation and written to Postgres.
  positions: Record<string, NodePosition>;
  setPosition: (id: string, x: number, y: number) => void;
  /** Bulk-initialise positions from the initial node fetch. */
  hydratePositions: (entries: Array<{ id: string; x: number; y: number }>) => void;

  // ── Canvas UI state ───────────────────────────────────────────────────────
  selectedNodeIds: ReadonlySet<string>;
  activeTool: CanvasTool;
  setSelectedNodeIds: (ids: ReadonlySet<string>) => void;
  setActiveTool: (tool: CanvasTool) => void;
}

export type CanvasStore = ReturnType<typeof createCanvasStore>;

/** Factory — call once per canvas mount, not at module level.
 * This prevents shared state between concurrent Next.js App Router renders. */
export function createCanvasStore() {
  return createStore<CanvasState>()((set) => ({
    positions: {},

    setPosition: (id, x, y) =>
      set((state) => ({
        positions: { ...state.positions, [id]: { x, y } },
      })),

    hydratePositions: (entries) =>
      set(() => ({
        positions: Object.fromEntries(entries.map(({ id, x, y }) => [id, { x, y }])),
      })),

    selectedNodeIds: new Set<string>(),
    activeTool: 'pointer' as CanvasTool,

    setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
    setActiveTool: (tool) => set({ activeTool: tool }),
  }));
}
