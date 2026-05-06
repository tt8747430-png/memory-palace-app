# ADR 5D — Advanced Canvas UX

**Date:** 2026-05-06  
**Status:** Accepted  
**Phase:** 5D (Advanced Canvas UX)  
**Refs:** `docs/archive/UI_STYLE_GUIDE-aspirational.md §2, §13`, `docs/archive/PERFORMANCE-aspirational.md §2`

---

## Context

Phase 5A and 5B delivered a working canvas: React Flow renders `MemoryNode` components, TanStack Query hydrates from the server, Zustand manages 60fps drag state, and mutations persist positions to Postgres. Phase 5C wired Supabase Realtime for cross-device sync.

Phase 5D adds the interaction layer that makes the canvas production-quality:

- Mobile users need touch-friendly affordances (`CanvasFab` + bottom-sheet editor) because the desktop toolbar is too small to tap.
- Desktop users need context menus, per-node toolbars, and multi-select batch operations.
- Everyone needs snap-to-grid and a lasso selection mode.
- Edit/delete callbacks must be injected into deeply-nested `MemoryNode` components without polluting their `data` prop (which React Flow serialises and compares shallowly).

---

## Decisions

### 1. Dual toolbar strategy: `CanvasToolbar` (desktop) + `CanvasFab` (mobile)

**Decision:** Two parallel toolbar components share identical Zustand state but render at different breakpoints.

- `CanvasToolbar` — `hidden md:flex`, anchored `bottom-4 left-1/2`, glassmorphic card with icon buttons.
- `CanvasFab` — `md:hidden`, fixed bottom-right FAB that expands a vertical action menu. Positioned with `pb-[env(safe-area-inset-bottom)]` to clear iOS chrome.

**Rationale:** A single responsive component would require conditional rendering of two completely different interaction models inside one file, making both harder to read and test. Splitting at the component boundary keeps each file under ~120 lines and their tests independent.

**Alternatives considered:**

- Single component with `useIsMobile` branching → rejected: too much conditional rendering in one file.
- Radial/circular FAB → too complex for initial iteration; vertical stack is sufficient.

---

### 2. Per-node `NodeToolbar` + Radix `ContextMenu`

**Decision:** Every `MemoryNode` renders two independent action surfaces:

1. **`NodeToolbar`** (React Flow primitive): a portal that appears _above_ the node on selection. Contains Edit (Pencil) and Delete (Trash2) buttons.
2. **`ContextMenu`** (Radix, from `@memory-palace/ui`): wraps the node card. Right-click opens an inline menu with the same Edit/Delete actions.

Both surfaces call `onEditNode(id)` / `onDeleteNode(id)` from `CanvasNodeActionsContext` rather than accepting callbacks via props.

**Rationale:**

- `NodeToolbar` is discoverable on selection; `ContextMenu` is a power-user shortcut.
- Using two surfaces covers both touch users (who tap to select, then tap the toolbar) and mouse users (who right-click by habit).

**`e.stopPropagation()` on node `onContextMenu`:** Without this, right-clicking a node would open both the node menu and the `PaneContextMenu`. The node's `<div onContextMenu={(e) => e.stopPropagation()}>` prevents event bubbling to the pane.

---

### 3. `CanvasNodeActionsContext` — callback injection without prop drilling

**Decision:** A dedicated `CanvasNodeActionsContext` injects `{ onEditNode, onDeleteNode }` into all descendant nodes via React Context, rather than passing them as `data` fields on each React Flow node object.

```
RoomCanvas (InnerCanvas)
└─ CanvasNodeActionsProvider (value = { onEditNode, onDeleteNode })
   └─ ReactFlow
      └─ MemoryNode
         └─ useCanvasNodeActions()  →  onEditNode / onDeleteNode
```

**Rationale:**

- React Flow performs a shallow equality check on `node.data` to decide whether to re-render a node. Functions are never referentially stable between renders, so including callbacks in `data` would cause every node to re-render on every state change.
- Context is stable across renders when the provider's `value` prop is the same object reference (or an object constructed once in `useMemo`). In `InnerCanvas`, the `nodeActions` object is reconstructed each render, but React Flow nodes only re-render when _their own_ data/position changes — the context update does not propagate through React Flow's internal virtualisation.

**Alternatives considered:**

- Pass callbacks through `data.onEdit` / `data.onDelete` → rejected: breaks React Flow's shallow-equality optimisation, causing all nodes to re-render whenever the parent re-renders.
- Module-level singleton store → rejected: breaks SSR and concurrent render isolation.

---

### 4. `PaneContextMenu` — portal-rendered, click-to-place node creation

**Decision:** Right-clicking the canvas pane opens a `PaneContextMenu` rendered via `createPortal(…, document.body)`. It captures the click's canvas-space coordinates (`screenToFlowPosition`) and offers "Add node here", "Fit view", and "Toggle snap".

**Rationale:** Rendering outside the canvas container avoids `overflow: hidden` clipping. The menu is dismissed by pressing Escape or clicking outside (captured via `document.addEventListener('pointerdown', …, { capture: true })`).

**Security note:** The `flowX/flowY` coordinates are passed directly to `addNode.mutate(…)`, which routes through a server action that Zod-validates and rate-limits the input. The canvas coordinates are numbers; there is no injection surface.

---

### 5. Snap-to-grid: Zustand flag + `G` key shortcut

**Decision:** `snapEnabled: boolean` lives in `canvasStore` (Zustand). `toggleSnap()` is called from:

1. `G`/`g` keyboard shortcut in `InnerCanvas` (captures `window.keydown`, guarded against `INPUT`/`TEXTAREA` focus).
2. `CanvasToolbar` snap button (desktop).
3. `CanvasFab` snap action (mobile).

React Flow's `snapToGrid` prop receives the live value; `snapGrid` is fixed at `[20, 20]` (20px matches the `Background` dot gap).

**Rationale:** A 20px grid aligns with the canvas background dots, giving users immediate visual confirmation that snap is active. The flag is not persisted to the server — it's a session-level preference. Persisting it to `localStorage` would be a trivial future enhancement via Zustand's `persist` middleware.

---

### 6. `SelectionMode.Partial` — Figma-style lasso

**Decision:** `selectionMode={SelectionMode.Partial}` is set on the `ReactFlow` component. This means the lasso selects any node that _partially_ overlaps the selection rectangle, matching Figma's behaviour.

**`selectionOnDrag`:** In pointer mode (`activeTool === 'pointer'`), dragging on an empty pane area initiates lasso selection. In pan mode, dragging pans the viewport instead. The flag is derived from `activeTool` rather than stored separately.

---

### 7. `SelectionToolbar` — batch delete for multi-select

**Decision:** A floating toolbar appears at `top-14 left-1/2` (above the `CanvasToolbar`) when `selectedNodeIds.size >= 2`. It shows a count badge and a "Delete all" button.

Each delete fires a separate `removeNode.mutate({ id })` call rather than a single bulk mutation. All calls cancel the same `roomNodesQueryKey`, so TanStack Query coalesces the cache updates into a single re-render.

**Rationale:** A dedicated bulk-delete server action would be more efficient for large selections, but the current per-node mutation already optimistically removes each node from the cache. At the expected scale (< 100 nodes per room), N individual mutations are acceptable. A bulk action is a future optimisation.

---

### 8. `NodeEditorSheet` — responsive side selection

**Decision:** The editor sheet uses `side={isMobile ? 'bottom' : 'right'}` based on `useIsMobile()` (a `matchMedia('(max-width: 768px)')` hook). The bottom sheet on mobile occupies ~60% of viewport height with `rounded-t-2xl`; the right panel on desktop is 400px wide.

A `useDebouncedCallback(500ms)` coalesces rapid text edits into a single `patchNode` mutation. `flush()` is called when the sheet closes to guarantee edits are not dropped on unmount.

---

## Architecture Diagram

```
                 ┌──────────────────────────────────┐
                 │          InnerCanvas             │
                 │  (useCanvasStore, useReactFlow)  │
                 └──┬──────────────┬───────────────┘
                    │              │
         ┌──────────▼──┐    ┌──────▼──────────────────┐
         │CanvasNodeAct│    │        ReactFlow          │
         │ionsProvider │    │  SelectionMode.Partial    │
         │  (Context)  │    │  snapToGrid={snapEnabled} │
         └──────┬──────┘    └────┬──────────────────────┘
                │                │
         ┌──────▼──────┐  ┌──────▼──────┐
         │ MemoryNode  │  │  Pane/Node  │
         │ (NodeToolbar│  │ContextMenus │
         │ ContextMenu)│  │  (portal)   │
         └─────────────┘  └─────────────┘

Desktop toolbar:        CanvasToolbar   (hidden md:flex)
Mobile FAB:             CanvasFab       (md:hidden)
Multi-select ops:       SelectionToolbar (≥2 selected)
Node editor:            NodeEditorSheet (right|bottom)
Snap shortcut:          G key + toolbar + FAB
```

---

## Performance Considerations

- **`onlyRenderVisibleElements`** stays enabled. The Phase 5D additions (toolbars, context menus) render outside the React Flow node tree and do not affect virtualisation.
- **`PaneContextMenu` portal:** avoids layout thrash by not affecting the canvas DOM. The menu is created once on right-click and destroyed on dismiss.
- **`NodeToolbar` portal:** React Flow manages the NodeToolbar portal lifecycle; it only mounts when `isVisible={selected}`. No idle-state DOM overhead.
- **`SelectionToolbar`:** returns `null` when `selectedNodeIds.size < 2`, so it is never in the DOM during normal (zero/single-select) canvas use.
- **Context menu visibility:** `ContextMenu` from Radix is lazy — the `ContextMenuContent` does not mount until the menu is triggered.

---

## Security Considerations

- All node mutations (add, delete, patch) route through Zod-validated, rate-limited server actions. Canvas coordinates are `number` types; no string interpolation occurs.
- `PaneContextMenu` position is derived from `event.clientX/Y` → `screenToFlowPosition()` — both are client-side-only values that never reach the server directly; they are passed as numeric `positionX`/`positionY` fields to the `createNode` server action, which validates them with Zod (`z.number().finite()`).
- `CanvasNodeActionsContext` callbacks (`onEditNode`, `onDeleteNode`) accept a `nodeId: string`. The server action validates ownership via RLS before executing the DELETE.

---

## Testing

| Layer        | What is tested                                                       | File                                      |
| ------------ | -------------------------------------------------------------------- | ----------------------------------------- |
| Unit         | `canvasStore` — 4 snap tests + existing tool/selection/editing tests | `__tests__/canvasStore.test.ts`           |
| Unit         | `useRoomNodeMutations` — addNode, removeNode, savePosition, batch    | `__tests__/useRoomNodeMutations.test.tsx` |
| E2E (future) | Drag node → reload → position persists                               | `playwright/tests/canvas.spec.ts`         |
| E2E (future) | Right-click pane → add node at position                              | `playwright/tests/canvas.spec.ts`         |
| E2E (future) | Select 3 nodes → SelectionToolbar visible → delete all               | `playwright/tests/canvas.spec.ts`         |
| E2E (future) | G key toggles snap; nodes align to 20px grid                         | `playwright/tests/canvas.spec.ts`         |

JSDOM cannot simulate React Flow pointer events. All interaction tests (drag, lasso, context menu) require Playwright.

---

## Consequences

- The canvas now has a complete interaction surface on both mobile and desktop.
- `CanvasNodeActionsContext` is the canonical way to inject per-node callbacks. Never add `onEdit`/`onDelete` to `MemoryNodeData`.
- Future "duplicate node" or "change color" actions follow the same pattern: add to `CanvasNodeActions`, surface in `NodeToolbar` + `ContextMenu` + `CanvasFab`.
- Snap-to-grid is intentionally session-only. If user research reveals strong demand for persistence, add `persist(canvasStore, { name: 'canvas-prefs', partialize: (s) => ({ snapEnabled: s.snapEnabled }) })` — no server changes needed.
