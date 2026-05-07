# ADR 7: Animations & Polish

**Status:** Accepted  
**Date:** 2026-05-07  
**Phase:** 7 — `v0.5.0`

---

## Context

Phase 7 adds micro-interactions, page transitions, node enter/exit animations, celebration confetti, and `prefers-reduced-motion` support. No animation infrastructure existed before this phase — all motion was plain Tailwind CSS utilities.

---

## Decisions

### 1. `LazyMotion` + `domAnimation` (not `motion` + `domMax`)

**Chosen:** `LazyMotion` provider at root with `domAnimation` features; `m` component used at call sites.

**Why:**

- `domAnimation` covers basic animations, `AnimatePresence`, and `useReducedMotion` — everything needed in Phase 7.
- `domMax` adds layout animations, drag, and 3D support (~30 KB extra gzipped). None of those are required until Phase 8 (flashcard 3D flip / potential layout animations).
- `LazyMotion` code-splits the feature bundle away from the framework core, reducing initial JS parse time.
- The `m` component pattern requires `LazyMotion` to be an ancestor. Placing `MotionProvider` in the root layout satisfies this for the entire app.

**Re-evaluate for:** Phase 8, if flashcard 3D flips (`rotateY`) require `domMax`.

---

### 2. `reducedMotion="user"` on `LazyMotion` + `useReducedMotion()` in components

**Chosen:** Three-layer reduced-motion strategy:

1. `reducedMotion="user"` prop on `LazyMotion` — library-level, sets all durations to 0 automatically.
2. `useReducedMotion()` hook in `PageTransition` and `MemoryNode` — overrides `transition.duration` to `0` explicitly.
3. Tailwind `motion-reduce:transition-none motion-reduce:hover:translate-y-0` CSS fallback — works if JS fails to hydrate.

**Why:** Defense-in-depth. The CSS fallback is the last line of defense for users on slow devices or with JS disabled.

---

### 3. `isExiting` state pattern for React Flow node deletion

**Chosen:** Local `isExiting: boolean` state; `handleDelete` sets it to `true`, waits 200ms, then calls `onDeleteNode`.

**Why:** React Flow manages its own node lifecycle and unmounts nodes when they are removed from the store. `AnimatePresence` wrapping is not feasible at the canvas level without fighting React Flow's internal rendering. The `isExiting` pattern plays the exit animation while the node is still mounted (still in the store), then triggers the actual store removal once the animation completes.

**Alternatives rejected:**

- Wrapping the entire `ReactFlow` component in `AnimatePresence` — not supported; React Flow does not expose individual node mount/unmount in a way compatible with AnimatePresence.
- `exit` variant on `m.div` without `AnimatePresence` — has no effect without an `AnimatePresence` parent.

**Edge cases handled:**

- If the node is removed by a remote mutation before the 200ms timeout, the node is already unmounted; `onDeleteNode` is a no-op on a non-existent id (Drizzle RLS returns 0 rows, no error).
- Rapid double-click on delete: `isExiting` is already `true` on the second click; `handleDelete` is idempotent.

---

### 4. Page transition via `AnimatePresence mode="wait"` keyed on `usePathname()`

**Chosen:** `PageTransition` client component wraps `{children}` in the dashboard layout. `AnimatePresence mode="wait"` ensures the exit animation completes before the enter animation starts.

**Why `mode="wait"` not `mode="sync"`:** With `sync`, both exit and enter animate simultaneously — on slow connections where the new page's Server Component data is still loading, this produces a jarring double-render. `wait` produces cleaner sequential transitions.

**Why `initial={false}` on `AnimatePresence`:** Suppresses the enter animation on the very first server-rendered page, preventing a flash/slide on initial load.

---

### 5. `canvas-confetti` via dynamic `import()` in `useConfetti`

**Chosen:** `canvas-confetti` is never statically bundled; it is loaded on-demand inside `useCallback` via `await import('canvas-confetti')`.

**Why:** `canvas-confetti` uses `document` and `window` APIs — it cannot run during SSR. Dynamic import ensures it is never included in the server bundle or the initial client bundle, saving ~7 KB on every page load until the hook is actually invoked.

**Note:** No achievement/badge feature exists in the current schema. `useConfetti` is delivered as a ready-to-use primitive for Phase 8+.

---

### 6. Tailwind CSS for simple hover interactions (no framer-motion)

**Chosen:** Card hover lift and button press use Tailwind utilities only:

- `transition-all hover:-translate-y-0.5 hover:shadow-lg` for card hover
- `active:scale-95 transition-transform` for button press
- `motion-reduce:hover:translate-y-0` disables the lift for reduced-motion users

**Why:** These are one-property CSS transitions with no enter/exit logic. Adding framer-motion for these would increase complexity with zero UX benefit. Tailwind handles them at zero JS cost.

---

## Files Changed

| Action   | File                                                                     |
| -------- | ------------------------------------------------------------------------ |
| Created  | `shared/lib/motion.ts`                                                   |
| Created  | `shared/components/MotionProvider.tsx`                                   |
| Created  | `shared/components/PageTransition.tsx`                                   |
| Created  | `shared/hooks/useConfetti.ts`                                            |
| Modified | `app/layout.tsx` — added `<MotionProvider>`                              |
| Modified | `app/(dashboard)/layout.tsx` — added `<PageTransition>`                  |
| Modified | `spatial-canvas/components/nodes/MemoryNode.tsx` — `m.div` + `isExiting` |
| Modified | `dashboard/components/RecentPalaces.tsx` — Tailwind hover lift           |
| Modified | `dashboard/components/StatsBar.tsx` — Tailwind hover lift                |

---

## Bundle Impact

| Metric                    | Before   | After                               |
| ------------------------- | -------- | ----------------------------------- |
| framer-motion (gzipped)   | 0 KB     | ~28 KB (loaded once, cached)        |
| canvas-confetti (gzipped) | 0 KB     | ~7 KB (loaded on demand only)       |
| Initial page JS           | baseline | +28 KB (framer-motion domAnimation) |
