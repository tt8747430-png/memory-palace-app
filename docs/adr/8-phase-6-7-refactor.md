# ADR 8: Phase 6-7 Structural Refactor

**Status:** Accepted  
**Date:** 2026-05-07  
**Phase:** Post-6/7 cleanup

---

## Context

After Phase 6 (command palette, chord shortcuts) and Phase 7 (framer-motion animations) landed, a targeted audit identified six structural flaws — two DRY violations, one dead file, one React anti-pattern, one Zustand API misuse, and untyped cross-boundary event names. No behaviour regressions; all changes are structural.

---

## Changes

### 1. `applyPositionSnapshot` extracted to `useCallback` in `RoomCanvas.tsx`

**Was:** Two byte-for-byte identical function bodies declared inside separate `useEffect` hooks (lines 257 and 341). A bug fix or signature change required editing both.

**Now:** Single `useCallback` declared once at component scope, listed in both effects' dep arrays. `saveBatchPositions` and `savePosition` captured once in the callback rather than re-captured per effect.

---

### 2. Route regexes centralised in `shared/lib/routes.ts`

**Was:** `PALACE_PAGE_RE` and `ROOM_ROUTE_RE` independently declared in `CommandPalette.tsx` and `useGlobalShortcuts.ts`. A route change required updating two files; a mismatch produces a silent feature breakage.

**Now:** Single source of truth in `apps/web/src/shared/lib/routes.ts`. Both files import from there.

---

### 3. Dead barrel `shared/lib/motion.ts` deleted

**Was:** `motion.ts` re-exported five framer-motion symbols that nothing in the codebase imported. All three consumers (`MotionProvider`, `PageTransition`, `MemoryNode`) imported directly from `framer-motion`. The file documented an intention that was never followed through.

**Now:** File deleted. Imports at call sites are unchanged.

---

### 4. `setTimeout` focus hack replaced with `useEffect` in `CanvasSearch.tsx`

**Was:**

```ts
setTimeout(() => inputRef.current?.focus(), 0);
```

Called in two branches of the `onKeyDown` handler. This defers focus to the next macrotask — invisible on fast machines, unreliable in background tabs or under heavy load, and non-deterministic in tests without fake timers.

**Now:**

```ts
useEffect(() => {
  if (visible) inputRef.current?.focus();
}, [visible]);
```

`useEffect` fires after the paint that made the input visible — the correct React hook for post-render DOM side effects. The `setTimeout` calls are removed from the event handler entirely.

---

### 5. Zustand `undoPositions` / `redoPositions` rewritten with `(set, get)`

**Was:**

```ts
undoPositions: (currentSnapshot) => {
  let result: NodePositionSnap[] | null = null;
  set((s) => {
    result = entry; // side effect inside a pure updater
    return { ... };
  });
  return result;
},
```

Assigning to an outer variable inside `set()`'s updater is a side-effect in a context Zustand treats as a pure transition. React Strict Mode invokes updaters twice in development, making `result` assignment run twice (benign here but structurally unsound).

**Now:**

```ts
undoPositions: (currentSnapshot) => {
  const { historyStack, futureStack } = get();
  if (historyStack.length === 0) return null;
  const stack = [...historyStack];
  const entry = stack.pop()!;
  set({ historyStack: stack, futureStack: [...futureStack, currentSnapshot] });
  return entry;
},
```

State is read via `get()` before the transition; `set()` receives a plain object with no side effects. Canonical Zustand `(set, get)` factory form.

---

### 6. Canvas custom event names consolidated in `shared/lib/canvasEvents.ts`

**Was:** Seven event names (`'canvas:undo'`, `'canvas:fit-view'`, etc.) duplicated as string literals across `CommandPalette.tsx`, `useGlobalShortcuts.ts`, and `RoomCanvas.tsx`. A typo in either the dispatcher or listener produces a silent runtime failure with no TypeScript or lint signal.

**Now:** `CANVAS_EVENTS` const object in `apps/web/src/shared/lib/canvasEvents.ts`. All dispatchers and listeners reference `CANVAS_EVENTS.*`. A rename now requires updating one file and TypeScript surfaces all stale usages immediately.

---

## Files Changed

| Action   | File                                         |
| -------- | -------------------------------------------- |
| Modified | `spatial-canvas/components/RoomCanvas.tsx`   |
| Modified | `spatial-canvas/store/canvasStore.ts`        |
| Modified | `spatial-canvas/components/CanvasSearch.tsx` |
| Modified | `shared/components/CommandPalette.tsx`       |
| Modified | `shared/hooks/useGlobalShortcuts.ts`         |
| Created  | `shared/lib/routes.ts`                       |
| Created  | `shared/lib/canvasEvents.ts`                 |
| Deleted  | `shared/lib/motion.ts`                       |

---

## Regression Risk

None. All changes are structural: same runtime logic, cleaner boundaries. TypeScript (`pnpm turbo typecheck`) and ESLint (`pnpm turbo lint`) pass cleanly post-refactor.
