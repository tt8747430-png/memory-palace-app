# ADR: Phase 5D — Advanced Canvas UX

**Status:** Accepted  
**Date:** 2026-05-06  
**Deciders:** Architecture review

## Context

Phase 5D extends the spatial canvas with two concerns:

1. **Mobile UX** — the current toolbar is desktop-only and the `NodeEditorSheet` opens from the right side on all screen sizes, which is ergonomically poor on phones.
2. **Advanced interactions** — snap-to-grid, per-node NodeToolbar, right-click context menus, and a multi-select action bar.

## Decisions

### 1. `CanvasNodeActionsContext` (new dependency injection context)

**Problem:** `MemoryNode` is a React Flow custom node rendered inside the RF engine. It needs to trigger mutations (delete) that require `roomId`, which is only available at the `InnerCanvas` level.

**Options considered:**

| Option                                          | Trade-off                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Add `roomId` to `MemoryNodeData`                | All nodes carry a redundant field; `dbNodeToFlowNode` becomes coupled to `roomId` |
| Call `useRoomNodeMutations` inside `MemoryNode` | `roomId` must come from somewhere; data is the only channel from React Flow       |
| **`CanvasNodeActionsContext`**                  | InnerCanvas provides typed callbacks; nodes stay data-only                        |

**Decision:** Inject `onEditNode(id)` and `onDeleteNode(id)` via a React Context created at the `InnerCanvas` level. `MemoryNode` consumes this context. Zero change to `MemoryNodeData`.

### 2. Node right-click context menu — `@radix-ui/react-context-menu`

**Problem:** A context menu needs proper ARIA roles, keyboard navigation (↑↓ arrow keys, Enter, Escape), and focus management.

**Decision:** Add `@radix-ui/react-context-menu` to `@memory-palace/ui`. This is consistent with the project's existing Radix strategy (`react-dialog`, `react-popover`, `react-separator`). Bundle impact is ~3KB gzipped.

No ADR upgrade required — this is a Radix UI primitive, not a new architectural decision category.

### 3. Canvas pane context menu — custom portal

**Problem:** Radix `ContextMenu` requires its `Trigger` to wrap the element that receives right-click events. Wrapping the entire React Flow pane is not feasible — React Flow controls the pane element.

**Decision:** Use React Flow's `onPaneContextMenu` event, store `{x, y}` in local state, and render a positioned `<menu>` via `createPortal`. This menu closes on `Escape` or outside click. No accessibility regression — pane menus are supplementary to keyboard shortcuts.

### 4. Snap-to-grid — Zustand store state

**Decision:** Add `snapEnabled: boolean` + `toggleSnap()` to `canvasStore`. Wire to React Flow's `snapToGrid` / `snapGrid={[20, 20]}`. Add `G` key shortcut via a `keydown` listener on the window (scoped to canvas mount). `G` is established convention in spatial editors (Figma, Miro).

### 5. Mobile FAB — replaces `CanvasToolbar` below `md`

**Decision:** `CanvasToolbar` gains `hidden md:flex`. A new `CanvasFab` component (`md:hidden`) renders a circular expand button above the bottom navigation. Its items mirror the desktop toolbar (Add Node, Pointer, Pan, Snap, Fit View). This follows the UI style guide's FAB pattern.

### 6. `NodeEditorSheet` responsive side

**Decision:** Use the `useIsMobile` hook to select `side="right"` on desktop and `side="bottom"` (with `h-[80dvh]`) on mobile. `useIsMobile` reads `matchMedia` on the client and returns `false` on the server (safe for hydration).

### 7. `SelectionToolbar` — absolute-positioned bar inside canvas container

**Decision:** A `div` positioned `absolute top-2 left-1/2 -translate-x-1/2` inside `canvas-container` that appears only when `selectedNodeIds.size > 1`. It shows a "Delete selected" button that fires `batchDeleteNodes` (existing per-node remove mutations). This avoids React Flow's NodeToolbar API (which is per-node) for multi-select scenarios.

## New files

| File                                                             | Purpose                       |
| ---------------------------------------------------------------- | ----------------------------- |
| `src/features/spatial-canvas/store/CanvasNodeActionsContext.tsx` | Context for node callbacks    |
| `src/features/spatial-canvas/components/CanvasFab.tsx`           | Mobile FAB toolbar            |
| `src/features/spatial-canvas/components/SelectionToolbar.tsx`    | Multi-select action bar       |
| `src/shared/hooks/useIsMobile.ts`                                | `matchMedia` hook             |
| `packages/ui/src/components/context-menu.tsx`                    | Radix context menu primitives |

## Modified files

| File                       | Change                                                       |
| -------------------------- | ------------------------------------------------------------ |
| `canvasStore.ts`           | + `snapEnabled`, `toggleSnap`                                |
| `MemoryNode.tsx`           | + `NodeToolbar`, `ContextMenu`, mobile touch target          |
| `CanvasToolbar.tsx`        | + snap toggle, fit view, `hidden md:flex`                    |
| `NodeEditorSheet.tsx`      | Responsive `side` prop                                       |
| `RoomCanvas.tsx`           | Snap props, `G` key, pane context menu, mount new components |
| `packages/ui/src/index.ts` | Export `ContextMenu` primitives                              |

## Consequences

- Context menu package adds ~3KB gzipped to the UI bundle.
- `useIsMobile` adds a single `matchMedia` listener per mounted canvas — negligible.
- `CanvasNodeActionsContext` adds one React context lookup per node render — negligible given React Compiler memoisation.
- Full-screen immersive takeover (hide nav during canvas) is deferred; it requires changes to the dashboard layout that go beyond canvas scope.
