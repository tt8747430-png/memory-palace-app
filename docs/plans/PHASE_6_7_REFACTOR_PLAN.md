# Phase 6-7 Refactoring Plan

**Status:** Pending approval  
**Scope:** `shared/` command-palette & shortcuts system, `spatial-canvas/` canvas event handling, Phase 7 animation infrastructure  
**Constraint anchor:** `.project_memory.md` — all global constraints apply. No new abstraction layers unless three or more call sites share the same pattern.

---

## Audit Summary

Six distinct flaws were identified across Phase 6-7 code. Two violate DRY, two violate clean Zustand/React patterns, one is dead code, one is an anti-pattern that produces a timing dependency.

---

## Issue 1 — `applyPositionSnapshot` duplicated in `RoomCanvas.tsx`

**Severity:** High (maintenance/correctness risk)  
**Files:** `apps/web/src/features/spatial-canvas/components/RoomCanvas.tsx`  
**Lines:** 257–268 (inside the `canvas:undo/redo/…` `useEffect`) and 341–358 (inside the keyboard shortcut `useEffect`)

**Problem:** The function body is byte-for-byte identical in both `useEffect`s. A bug fix or a signature change (e.g. adding batch-save retry logic) must be applied twice. The two closures also capture the same unstable `saveBatchPositions` / `savePosition` references, forcing both `useEffect`s to list them as deps.

**Fix:** Extract to a `useCallback` at component scope, declared once, listed in both effects' dep arrays:

```ts
// Inside InnerCanvas, before the useEffect blocks:
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
```

Remove both local `applyPositionSnapshot` declarations and replace their call sites with the shared callback.

---

## Issue 2 — `PALACE_PAGE_RE` / `ROOM_ROUTE_RE` duplicated across two files

**Severity:** High (divergence risk — regexes can drift silently)  
**Files:**

- `apps/web/src/shared/components/CommandPalette.tsx` lines 51–52
- `apps/web/src/shared/hooks/useGlobalShortcuts.ts` lines 28–30

**Problem:** Both files define identical regex constants. If a route pattern changes (e.g. rooms moved to `/r/[roomId]`), only one file may be updated, creating a silent routing mismatch.

**Fix:** Create `apps/web/src/shared/lib/routes.ts` with the single source of truth:

```ts
/** Matches /palaces/[palaceId] — palace detail page only. */
export const PALACE_PAGE_RE = /^\/palaces\/([^/]+)$/;
/** Matches /palaces/[palaceId]/rooms/[roomId] and sub-paths. */
export const ROOM_ROUTE_RE = /^\/palaces\/[^/]+\/rooms\/[^/]+/;
```

Remove the local declarations from both files and import from `@/shared/lib/routes`.

**Regression guard:** Existing tests in `CommandPalette.test.tsx` and `useGlobalShortcuts.test.tsx` cover the path-matching behaviour; no new tests required.

---

## Issue 3 — `shared/lib/motion.ts` barrel is dead code

**Severity:** Medium (confusion / false documentation)  
**File:** `apps/web/src/shared/lib/motion.ts`

**Problem:** The barrel re-exports `LazyMotion`, `domAnimation`, `m`, `AnimatePresence`, and `useReducedMotion` from `framer-motion`. Zero application files import from this barrel — confirmed by grep returning no results. `MotionProvider.tsx`, `PageTransition.tsx`, and `MemoryNode.tsx` all import directly from `framer-motion`. The barrel documents an intention that was never followed through, and will mislead future contributors into thinking there is a project-wide aliasing convention.

**Fix:** Delete `apps/web/src/shared/lib/motion.ts`. No other changes required (no consumers exist).

---

## Issue 4 — `setTimeout(..., 0)` focus hack in `CanvasSearch.tsx`

**Severity:** Medium (timing dependency, test fragility)  
**File:** `apps/web/src/features/spatial-canvas/components/CanvasSearch.tsx`  
**Lines:** 37 and 42

**Problem:**

```ts
setTimeout(() => inputRef.current?.focus(), 0);
```

This defers focus until the next macrotask, creating an invisible race condition: if the browser defers the task further (busy main thread, background tab), focus may not move. It also makes component tests non-deterministic without fake timers.

**Fix:** Replace both `setTimeout` calls with a `useEffect` that fires after `visible` flips to `true`:

```ts
useEffect(() => {
  if (visible) inputRef.current?.focus();
}, [visible]);
```

`useEffect` fires synchronously after the paint that made the input visible, which is the correct React lifecycle hook for post-render DOM side effects. Remove the two `setTimeout` calls inside `onKeyDown`.

---

## Issue 5 — Zustand `undoPositions` / `redoPositions` use closure side-effects inside `set()`

**Severity:** Medium (React Strict Mode double-invocation, Zustand API misuse)  
**File:** `apps/web/src/features/spatial-canvas/store/canvasStore.ts`  
**Lines:** 85–98 (`undoPositions`) and 100–113 (`redoPositions`)

**Problem:** Both actions assign to an outer `let result` variable inside the `set()` updater:

```ts
undoPositions: (currentSnapshot) => {
  let result: NodePositionSnap[] | null = null;
  set((s) => {
    // ...
    result = entry;  // side effect inside a pure updater
    return { ... };
  });
  return result;
},
```

Zustand's `set(updater)` is designed to be a pure transition function. In React 18+ Strict Mode, state updaters are invoked twice in development to surface side-effect bugs. The double-invocation here is benign in practice (the final assignment wins), but it is not idiomatic and will cause confusion when Zustand's dev-tools log intermediate states.

**Fix:** Use the `(set, get)` factory form so the current state is read imperatively before the transition:

```ts
export function createCanvasStore() {
  return createStore<CanvasState>()((set, get) => ({
    // ... all other actions unchanged ...

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
  }));
}
```

The `createStore<CanvasState>()((set, get) => ...)` signature is identical for all other actions already using `set`; only `undoPositions` and `redoPositions` are changed.

---

## Issue 6 — Canvas custom event names are untyped string literals

**Severity:** Low-Medium (typo risk, no auto-complete)  
**Files:** `CommandPalette.tsx`, `useGlobalShortcuts.ts`, `RoomCanvas.tsx`

**Problem:** Event names like `'canvas:create-node'`, `'canvas:undo'`, etc. appear as bare string literals in both the dispatcher (shared feature) and the listener (canvas feature). A typo or rename in one file silently breaks the feature — no TypeScript error, no test failure.

**Fix:** Add a `CANVAS_EVENTS` const to `apps/web/src/shared/lib/canvasEvents.ts`:

```ts
export const CANVAS_EVENTS = {
  CREATE_NODE: 'canvas:create-node',
  FIT_VIEW: 'canvas:fit-view',
  TOGGLE_SNAP: 'canvas:toggle-snap',
  UNDO: 'canvas:undo',
  REDO: 'canvas:redo',
  DUPLICATE_NODE: 'canvas:duplicate-node',
  DELETE_NODE: 'canvas:delete-node',
} as const;
```

Replace all string literals in `CommandPalette.tsx`, `useGlobalShortcuts.ts`, and `RoomCanvas.tsx` with `CANVAS_EVENTS.*`.

This file lives in `shared/lib/` (not in `spatial-canvas/`) because `CommandPalette` and `useGlobalShortcuts` are shared-feature consumers — consistent with the cross-feature boundary rule in `CLAUDE.md`.

---

## Execution Order

| #   | Change                                           | Files                                                            | Risk                               |
| --- | ------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------- |
| 1   | Extract `applyPositionSnapshot` to `useCallback` | `RoomCanvas.tsx`                                                 | Low — pure refactor, same logic    |
| 2   | Extract route regexes to `shared/lib/routes.ts`  | `routes.ts` (new), `CommandPalette.tsx`, `useGlobalShortcuts.ts` | Low — trivial extraction           |
| 3   | Delete dead `motion.ts` barrel                   | `motion.ts` (delete)                                             | None — zero consumers              |
| 4   | Replace `setTimeout` focus with `useEffect`      | `CanvasSearch.tsx`                                               | Low — cleaner lifecycle hook       |
| 5   | Rewrite Zustand store with `(set, get)`          | `canvasStore.ts`                                                 | Low — logic identical, API correct |
| 6   | Add `CANVAS_EVENTS` const, update call sites     | `canvasEvents.ts` (new), 3 files                                 | Low — string literals only         |

---

## Regression Prevention

- **Existing tests cover** `CommandPalette`, `ShortcutsOverlay`, `useGlobalShortcuts`, and `canvasStore` — run `pnpm turbo test` before and after each change.
- **No behaviour changes** — all six issues are structural refactors with identical runtime semantics.
- **Type check gate** — `pnpm turbo typecheck` catches any import paths that were missed.
- **Lint gate** — `eslint-plugin-boundaries` enforces cross-feature imports; `canvasEvents.ts` and `routes.ts` land in `shared/lib/` which is allowed by all consumers.

---

## Out of Scope (explicitly deferred)

- **`InnerCanvas` God Component extraction** — the component is large (~450 lines) but each `useEffect` block has distinct dependencies and captures distinct mutation refs. Splitting it would require threading refs across hook boundaries, adding indirection with no observable simplification. Deferred to Phase 8 refactor if the file grows further.
- **Context duplication (`CommandPaletteContext` vs `ShortcutsOverlayContext`)** — two instances do not meet the "three or more" threshold for a shared abstraction per `CLAUDE.md`.
- **`handleDelete` async/Promise pattern in `MemoryNode`** — the ADR explicitly documents this design choice and its edge-case handling. No change warranted.
