# Phase 7 Implementation Plan — Animations & Polish

**Version:** `v0.5.0`  
**Goal:** Add micro-interactions, page transitions, node enter/exit animations, celebration confetti, and `prefers-reduced-motion` support.  
**Status:** PENDING APPROVAL

---

## 1. Context Summary

### What exists today

- Next.js 16.2.4 App Router, React 19.2.5, React Compiler enabled
- React Flow canvas (`@xyflow/react` v12) with `MemoryNode` custom node
- Dashboard with `RecentPalaces`, `StatsBar`, `WelcomeBanner` (all Server Components)
- `DashboardShell` → `DashboardLayout` → per-page `(dashboard)` routes
- No framer-motion, no canvas-confetti. Current hover/loading animations are pure Tailwind CSS.
- Tests: 193 passing (Vitest + RTL)

### What Phase 7 adds

framer-motion (`LazyMotion` pattern) + canvas-confetti for:

| Trigger                  | Duration | Implementation                                                                      |
| ------------------------ | -------- | ----------------------------------------------------------------------------------- |
| Page transition          | 200ms    | `AnimatePresence` + `m.div key={pathname}`                                          |
| Node creation on canvas  | 300ms    | `m.div` initial `scale:0 opacity:0` → animate                                       |
| Node deletion            | 200ms    | local `isExiting` state → exit animation → then call delete mutation                |
| Flashcard flip (future)  | 400ms    | `m.div rotateY`                                                                     |
| Badge/achievement unlock | 1500ms   | `canvas-confetti` imperative call                                                   |
| Button press             | 100ms    | Tailwind `active:scale-95 transition-transform` (no framer needed)                  |
| Card hover               | 150ms    | Tailwind `hover:shadow-lg hover:-translate-y-0.5 transition-all` (no framer needed) |

---

## 2. New Dependencies

```bash
pnpm add framer-motion canvas-confetti --filter web
pnpm add -D @types/canvas-confetti --filter web
```

- `framer-motion` — page transitions + node enter/exit + future layout animations
- `canvas-confetti` — browser-only, dynamically imported; used for achievement celebrations

---

## 3. Files to Create

### `apps/web/src/shared/lib/motion.ts`

Re-exports `LazyMotion` features. Centralises the import so only one chunk is loaded.

```ts
// Exports: domAnimation features + LazyMotion + m + AnimatePresence
export { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
```

> Uses `domAnimation` (not `domMax`) — saves ~30 KB. No layout animations needed in Phase 7.

---

### `apps/web/src/shared/components/MotionProvider.tsx`

`'use client'` wrapper that provides `LazyMotion` to the component tree. Placed once in `apps/web/src/app/layout.tsx`.

```tsx
'use client';
import { LazyMotion, domAnimation } from 'framer-motion';
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
```

---

### `apps/web/src/shared/components/PageTransition.tsx`

`'use client'` component that reads `usePathname()` and keys each page for `AnimatePresence`. Wraps `{children}` in the dashboard layout.

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="motion-reduce:transition-none motion-reduce:animate-none"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
```

> **Reduced-motion**: the Tailwind `motion-reduce:` classes disable transitions for users who have `prefers-reduced-motion: reduce` set. We also call framer-motion's `useReducedMotion()` inside the component and set `duration: 0` when it returns `true`.

---

### `apps/web/src/shared/hooks/useConfetti.ts`

`'use client'` hook that dynamically imports `canvas-confetti` and exposes a `fire()` function. Dynamic import prevents the browser-only library from being bundled in SSR paths.

```ts
'use client';
export function useConfetti() {
  const fire = useCallback(async () => {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, []);
  return { fire };
}
```

---

## 4. Files to Modify

### `apps/web/src/app/layout.tsx`

Add `<MotionProvider>` inside `<ThemeProvider>` so `LazyMotion` is available everywhere.

```diff
- <ThemeProvider ...>{children}</ThemeProvider>
+ <ThemeProvider ...>
+   <MotionProvider>{children}</MotionProvider>
+ </ThemeProvider>
```

---

### `apps/web/src/app/(dashboard)/layout.tsx`

Wrap `{children}` with `<PageTransition>`. Children are Server Component output passed as props — this is the correct App Router pattern (client boundary wraps server subtree as children, not imports).

```diff
- <DashboardShell ...>{children}</DashboardShell>
+ <DashboardShell ...>
+   <PageTransition>{children}</PageTransition>
+ </DashboardShell>
```

---

### `apps/web/src/features/spatial-canvas/components/nodes/MemoryNode.tsx`

Wrap the outermost node `<div>` with `m.div` for enter animation. Exit animation requires an `isExiting` local state pattern (see Edge Cases).

**Enter** (straightforward):

```diff
- <div className={cn('group relative min-h-[60px] min-w-[120px]', ...)} ...>
+ <m.div
+   className={cn('group relative min-h-[60px] min-w-[120px]', ...)}
+   initial={{ scale: 0, opacity: 0 }}
+   animate={{ scale: 1, opacity: 1 }}
+   transition={{ duration: 0.3, ease: 'easeOut' }}
+   ...
+ >
```

**Exit** (requires `isExiting` state + delayed delete):

```tsx
const [isExiting, setIsExiting] = useState(false);

const handleDelete = useCallback(async () => {
  setIsExiting(true);
  // Let exit animation play (200ms), then call the real delete
  await new Promise((r) => setTimeout(r, 200));
  onDeleteNode(id);
}, [id, onDeleteNode]);
```

```diff
  <m.div
    animate={isExiting ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
    transition={{ duration: isExiting ? 0.2 : 0.3, ease: isExiting ? 'easeIn' : 'easeOut' }}
  >
```

---

### `apps/web/src/features/dashboard/components/RecentPalaces.tsx`

Add Tailwind-only hover lift to palace cards. No framer-motion needed for simple CSS transitions:

```diff
- <Card className="...existing...">
+ <Card className="...existing... transition-all hover:shadow-lg hover:-translate-y-0.5">
```

---

### `apps/web/src/features/dashboard/components/StatsBar.tsx`

Same Tailwind hover lift on stat cards.

---

## 5. Reduced-Motion Strategy

Three-layer approach:

1. **Tailwind** — `motion-reduce:transition-none motion-reduce:animate-none` on all animated elements as a CSS safety net
2. **framer-motion** — `useReducedMotion()` hook in `PageTransition` and `MemoryNode`; when `true`, set `transition={{ duration: 0 }}`
3. **framer-motion global** — `LazyMotion` with `reducedMotion="user"` prop (respects `prefers-reduced-motion` at the library level automatically)

---

## 6. Bundle Impact

| Before            | After                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| 0 KB animation JS | +~28 KB framer-motion (domAnimation, gzipped)                            |
| 0 KB confetti     | +~7 KB canvas-confetti (dynamically loaded, only on achievement trigger) |

`domAnimation` vs `domMax`: saves ~30 KB by omitting layout animations, drag, and 3D transforms — none are needed in Phase 7. `domMax` will be reconsidered in Phase 8 if flashcard 3D flips are added.

---

## 7. Edge Cases & Loading States

| Scenario                                | Handling                                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR / initial page render               | `AnimatePresence initial={false}` suppresses the first-render animation (prevents flash)                                                                       |
| Rapid navigation clicks                 | `AnimatePresence mode="wait"` ensures exit fully completes before enter starts                                                                                 |
| React Flow node deletion race condition | `isExiting` local state delays the actual store/mutation call by 200ms; rollback on error still works correctly                                                |
| `prefers-reduced-motion`                | Duration forced to `0`, Tailwind safety net active                                                                                                             |
| `canvas-confetti` in SSR                | Dynamic `import('canvas-confetti')` inside `useCallback` — never runs on server                                                                                |
| React Compiler compatibility            | All variants defined as module-level constants (not inside render). No `useCallback` wrappers for static variant objects — React Compiler handles memoisation  |
| Multiple rapid node creations           | Each node mounts independently; no shared `AnimatePresence` needed — React Flow's internal map handles this                                                    |
| `isExiting` + query invalidation        | If TanStack Query re-fetches and removes the node before the 200ms exit completes, the animation is interrupted cleanly (node already unmounted by React Flow) |

---

## 8. Testing Plan

### Unit tests (Vitest + RTL)

- `PageTransition` — renders children, applies `key={pathname}`, does not crash
- `useConfetti` — `fire()` dynamically imports confetti module (mock the import)
- `MotionProvider` — wraps children without errors

### Visual / E2E (Playwright — no specs yet, but noted)

- Page navigation shows fade+slide transition
- Node creation shows scale-in animation
- Node deletion shows scale-out before removal
- `prefers-reduced-motion` media query emulated → no visible transitions

---

## 9. File Tree Summary

```
apps/web/src/
├── app/
│   ├── layout.tsx                          MODIFY — add MotionProvider
│   └── (dashboard)/
│       └── layout.tsx                      MODIFY — add PageTransition
├── features/
│   ├── dashboard/components/
│   │   ├── RecentPalaces.tsx               MODIFY — Tailwind hover lift
│   │   └── StatsBar.tsx                    MODIFY — Tailwind hover lift
│   └── spatial-canvas/components/nodes/
│       └── MemoryNode.tsx                  MODIFY — m.div enter/exit
└── shared/
    ├── components/
    │   ├── MotionProvider.tsx              CREATE
    │   └── PageTransition.tsx              CREATE
    ├── hooks/
    │   └── useConfetti.ts                  CREATE
    └── lib/
        └── motion.ts                       CREATE
```

**ADR:** `docs/adr/7-animations-polish.md` (written during execution)

---

## 10. Out of Scope for Phase 7

- Tab switch underline (`layoutId`) — deferred to when tabbed navigation exists
- Flashcard 3D flip — no flashcard feature built yet
- Pull-to-refresh — no native mobile app; browser pull-to-refresh not in scope
- Streak pulse glow — no streak/badge feature in current schema
- `canvas-confetti` trigger point — the `useConfetti` hook is built but not wired to any achievement event (no badge/achievement feature exists yet); it is provided as a ready-to-use primitive
