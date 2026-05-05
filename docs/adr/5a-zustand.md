# ADR 5A-002: Transient Canvas State — Zustand

**Status:** Accepted for Phase 5A

## Context

Dragging a node on the canvas fires `onNodeDrag` at 60fps. Each event carries updated XY coordinates. If those coordinates live in React state (`useState` or a Context), every update triggers a full subtree re-render — dropping frames and creating jank on lower-end hardware.

Two categories of state need to be managed client-side:

1. **Transient canvas state** — node positions during an active drag (not yet persisted). Must update at 60fps without causing React re-renders of unrelated components (sidebar, room header, node count badge).
2. **Canvas UI state** — selected node IDs, active tool (pointer / hand / text-create), sidebar open/closed. Lower frequency, but still benefits from fine-grained subscription.

Neither category belongs in a server component or TanStack Query — they are pure client-side interaction state with no server counterpart.

## Options considered

### 1. `useState` + prop drilling

Simple, but coordinates in a parent component cause every child to re-render on each `onNodeDrag` event. With 50 nodes on screen, this is 50 × 60 = 3,000 wasted renders per second. **Rejected.**

### 2. React Context

Same re-render problem as `useState` — all consumers of a context re-render when its value changes. `useMemo` + `useRef` workarounds exist but produce brittle code. **Rejected.**

### 3. Jotai (atomic model)

Excellent for fine-grained atom subscriptions. The atom-per-node pattern works well and avoids over-rendering. However, Jotai's async atom model and React Suspense integration adds complexity that is unnecessary for synchronous canvas coordinates. Zustand's flat store is a better fit for the "canvas as a single coherent unit" mental model. **Not selected (viable alternative).**

### 4. Valtio (proxy-based)

Proxy mutation feels natural but can surprise React Compiler's static analysis. Valtio's snapshot model also makes it harder to apply selector-based subscriptions that skip renders. **Rejected.**

### 5. Zustand v5

- Subscribes components to slices of state via selector functions; unsubscribed components never re-render
- Mutations are plain function calls (`set(state => ...)`) — no action/reducer ceremony
- `temporal` middleware (via `zustand/middleware`) is available for undo/redo in Phase 5D
- `persist` middleware can optionally snapshot canvas UI state to `localStorage`
- Zero dependencies; 1.1 KB gzip
- Works outside React components (useful in `onNodeDragStop` handlers that live inside React Flow callbacks)
- React Compiler is compatible — Zustand selectors are stable references
- v5 (released Oct 2024) drops CJS-only builds, improves TypeScript inference, removes deprecated `StateCreator` patterns

**Selected.**

## Decision

**Use Zustand v5 for all transient canvas state and canvas UI state.**

Server-fetched data (the canonical node list, palace metadata) lives in TanStack Query, not Zustand. Zustand holds only what cannot be derived from the server: in-flight drag positions and UI interaction state.

## Implementation notes

- Store location: `apps/web/src/features/spatial-canvas/store/useCanvasStore.ts`
- Single store, sliced by concern (nodes slice, UI slice) via Zustand's slice pattern — avoids the proliferation of micro-stores
- On `onNodeDragStop`, the store is updated with the final position, then TanStack Query fires the mutation to persist. The Zustand position is the authoritative local position; TanStack Query position is the server-confirmed position
- Selector usage: `const position = useCanvasStore(s => s.nodes[id]?.position)` — only the component rendering that node re-renders
- No Zustand state crosses the server boundary; the store is instantiated once per page mount (not a singleton across requests). The store factory pattern (`createCanvasStore`) rather than a module-level store is required when using Zustand in Next.js App Router to avoid shared state between concurrent server renders

## Consequences

- Adds ~1.1 KB gzip to the canvas route bundle.
- All canvas state is ephemeral — a page reload fetches fresh positions from Postgres (via TanStack Query). Zustand is not the source of truth; it is a render-performance buffer.
- The undo/redo system (Phase 5D) will use Zustand's `temporal` middleware, which records position snapshots. This is accounted for in the store design (positions stored as a map, not embedded in React Flow's internal state).
