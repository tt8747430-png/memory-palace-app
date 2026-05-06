# ADR: Phase 2–5D Follow-Up Audit

**Status:** Accepted  
**Date:** 2026-05-06  
**Scope:** `apps/web/src/features/spatial-canvas/lib/canvasUtils.ts`

---

## Context

A follow-up audit was conducted after commit `cf43183` (phase 2–5D modernization) to confirm all
seven fixes are present in the working tree and to surface any issues introduced by the DRY
extraction itself. All seven prior fixes were confirmed in place. One additional issue was found
in the newly extracted helper `getCanvasCenterFlowPos`.

---

## Issue Found

### `canvasUtils.ts` — production code coupled to a test attribute

**Flaw:**

```ts
const rect = document.querySelector('[data-testid="canvas-container"]')?.getBoundingClientRect();
const x = rect ? rect.left + rect.width / 2 : 400;
const y = rect ? rect.top + rect.height / 2 : 300;
return screenToFlowPosition({ x, y });
```

Three problems compound here:

1. **Production–test coupling.** The `data-testid` attribute exists solely for Playwright E2E
   selectors. Production logic that depends on it will silently break if the attribute is ever
   renamed, moved to a wrapper element, or removed from the container div. Test attributes are
   not part of the public API contract of a component.

2. **Fragile DOM query.** `document.querySelector` can return `null` during component
   transitions — for example if `InnerCanvas` is unmounting while the user triggers an add-node
   action. The null-coalescing fallback `{x: 400, y: 300}` is a magic number that places nodes
   at an arbitrary non-centre screen position and is invisible to the caller.

3. **Unnecessary DOM dependency.** `screenToFlowPosition` from `useReactFlow()` accepts
   window-space screen coordinates and converts them to React Flow flow coordinates. The window
   centre (`window.innerWidth / 2`, `window.innerHeight / 2`) is always the correct origin for
   "place a node at the visual centre of the viewport." There is no need to locate the canvas
   container element at all.

**Fix:**

```ts
return screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
```

This collapses 4 lines to 1, removes the DOM dependency entirely, and eliminates both the
test-attribute coupling and the magic number fallbacks. `window` is safe here because
`getCanvasCenterFlowPos` is only called from click handlers inside `'use client'` components —
never during SSR.

The `data-testid="canvas-container"` attribute on the div in `RoomCanvas.tsx` is unchanged; it
remains in place for Playwright E2E tests.

---

## Prior Fixes Confirmed In Place (cf43183)

| Fix                                            | File                  | Status                                   |
| ---------------------------------------------- | --------------------- | ---------------------------------------- |
| Dead `channelRef` removed                      | `useRealtimeNodes.ts` | ✅ confirmed                             |
| HMR singleton — Supabase browser client        | `supabase-browser.ts` | ✅ `globalThis.__mpSupabaseBrowser`      |
| HMR singleton — BroadcastChannel               | `cross-tab-sync.ts`   | ✅ `globalThis.__mpBroadcastChannel ??=` |
| `fitView` boolean → `shouldFitView`            | `RoomCanvas.tsx:251`  | ✅ confirmed                             |
| Redundant `useCallback`/`useMemo` removed      | `RoomCanvas.tsx`      | ✅ React Compiler handles it             |
| `handleAddNode` DRY → `getCanvasCenterFlowPos` | `canvasUtils.ts`      | ✅ (this fix introduced the issue above) |
| No-op `revalidatePath` removed                 | `createNode.ts`       | ✅ confirmed                             |

---

## Confirmed Unchanged Decisions

The following were reviewed and left as-is:

- **`SelectionToolbar` N-mutations-per-delete pattern.** Fires one `removeNode` mutation per
  selected node rather than a batch. A `batchDeleteNodes` server action would require a new
  schema and multi-row soft-delete procedure. The current pattern is documented accepted behavior;
  TanStack Query serializes the invalidations within a tick, and the button is disabled via
  `removeNode.isPending` while any mutation is in flight.

- **`CanvasErrorBoundary` as a class component.** React 19 does not yet provide a hook-based
  equivalent that can catch render-phase errors. The class component is the only correct
  implementation for this use case. This is a React platform constraint, not legacy code.

- **React Compiler — no manual `useCallback`/`useMemo`.** `reactCompiler: true` is set in
  `next.config.ts`. Manual memoization is not added anywhere in the canvas feature.

- **`onPaneContextMenu` in `RoomCanvas.tsx` uses `containerRef`.** Already uses a direct React
  ref (`containerRef.current?.getBoundingClientRect()`) rather than a DOM query — this is the
  correct pattern and was already fixed in cf43183.

---

## Consequences

- `getCanvasCenterFlowPos` no longer queries the DOM and has no silent failure mode.
- `CanvasToolbar` and `CanvasFab` callers are unchanged — function signature is identical.
- The fix is consistent with the existing `onPaneContextMenu` approach in `RoomCanvas.tsx`,
  which already avoids test-attribute DOM queries by using a direct `containerRef`.
