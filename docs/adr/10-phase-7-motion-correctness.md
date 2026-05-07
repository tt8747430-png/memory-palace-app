# ADR 10 — Phase 7 Refactor: Motion Correctness Pass

**Status:** Accepted
**Date:** 2026-05-07
**Phase:** 7 (third pass; supersedes ADR 7 §2 wiring and §5 confetti primitive)

---

## Context

Phase 7 (animations & polish — ADR 7) shipped framer-motion infrastructure,
page transitions, node enter/exit animations, and a `useConfetti` hook.
ADR 8 already removed the dead `shared/lib/motion.ts` barrel. This pass
addresses three remaining issues: a documented reduced-motion decision that
was never wired up, a self-coordinating animation timer in `MemoryNode`, and
an unused hook delivered as a "primitive for Phase 8."

---

## Decisions

### 1. Library-level reduced-motion via `MotionConfig reducedMotion="user"`

**Was:** `<LazyMotion features={domAnimation}>{children}</LazyMotion>`. ADR 7
§2 documented `reducedMotion="user"` as layer 1 of a three-layer reduced-motion
strategy, but the prop was never added. With only the per-component
`useReducedMotion()` calls and Tailwind `motion-reduce:` classes acting as
layers 2 and 3, any future `m.*` consumer that forgot `useReducedMotion()`
would animate against the user's preference.

**Now:**

```tsx
<LazyMotion features={domAnimation} strict>
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
</LazyMotion>
```

`reducedMotion` is a `<MotionConfig>` prop, not a `<LazyMotion>` prop — the
first execution attempt typecheck-failed with `Property 'reducedMotion' does
not exist on type 'IntrinsicAttributes & LazyProps'`. The corrected wiring
nests `MotionConfig` inside `LazyMotion` so the lazy-feature lookup still
applies and reduced-motion zeroes durations everywhere.

`strict` was added at the same time. It surfaces accidental imports of the
heavyweight `motion` component (vs the LazyMotion-required `m`) at runtime
in dev. Currently nothing imports `motion`; this prevents future regressions.

### 2. `MemoryNode` exit animation driven by `onAnimationComplete`

**Was:** `handleDelete` flipped `setIsExiting(true)`, awaited
`new Promise(r => setTimeout(r, 200))`, then called `onDeleteNode(id)`. Two
issues:

1. The `200` ms hardcode had to equal the `transition.duration: 0.2` value
   34 lines below it. Drift was silent — no test or type caught a mismatch.
2. The timer-based coordination raced with React's render schedule.
   Idempotent on the mutation side (Drizzle returns 0 rows for a deleted
   id), but the construct itself was fragile.

**Now:** framer-motion's `onAnimationComplete` receives the target variant
name when a transition finishes. The mutation fires from the animation
event, with no timer:

```tsx
const NODE_VARIANTS = {
  initial: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exiting: { scale: 0.8, opacity: 0 },
} as const;
const ENTER_DURATION = 0.3;
const EXIT_DURATION = 0.2;

const handleDelete = useCallback(() => {
  if (shouldReduceMotion) {
    onDeleteNode(id);
    return;
  }
  setIsExiting(true);
}, [id, onDeleteNode, shouldReduceMotion]);

<m.div
  variants={NODE_VARIANTS}
  initial="initial"
  animate={isExiting ? 'exiting' : 'visible'}
  transition={{
    duration: shouldReduceMotion ? 0 : isExiting ? EXIT_DURATION : ENTER_DURATION,
    ease: isExiting ? 'easeIn' : 'easeOut',
  }}
  onAnimationComplete={(definition) => {
    if (definition === 'exiting') onDeleteNode(id);
  }}
>
```

Three side wins fall out:

- **Variants are now consistent.** Previously the `animate` prop switched
  between a variant-name string (`'animate'`) and a literal object
  (`{ scale: 0.8, opacity: 0 }`). All three states are now referenced by
  name; no inline target objects in `animate`.
- **No magic-number drift.** `EXIT_DURATION` is the single source for both
  the visual transition and the implied "time until mutation fires."
- **Rapid double-click is a no-op.** Setting `isExiting = true` a second
  time produces no new animation cycle, so `onAnimationComplete` fires once
  and the mutation runs once.

### 3. `useConfetti` hook deleted

**Was:** `apps/web/src/shared/hooks/useConfetti.ts` — a 12-line wrapper
around dynamic `import('canvas-confetti')` shipped as a "primitive for
Phase 8." Zero callers. `canvas-confetti` and `@types/canvas-confetti`
were in `apps/web/package.json` for this hook alone.

**Now:** Hook deleted; `pnpm --filter @memory-palace/web remove
canvas-confetti @types/canvas-confetti` removed both packages. When Phase 8
actually wires confetti to an achievement event, the hook can be re-added
next to its caller in `features/<achievements>/hooks/`.

This applies the same standard ADR 8 used to delete the dead
`shared/lib/motion.ts` barrel: `CLAUDE.md`'s "no half-finished
implementations" rule. Zero-caller code carries maintenance cost (lint,
typecheck, dependency audit, dependabot churn) for zero user value.

---

## Out of scope

- **Migrating `framer-motion` → `motion/react` import path.** The package
  was rebranded in v12; the `framer-motion` re-export remains canonical for
  this dependency. No observable benefit to a 4-file rename.
- **Removing per-component `useReducedMotion()` calls.** With
  `MotionConfig reducedMotion="user"` durations are zeroed by the library.
  The hook calls in `PageTransition` and `MemoryNode` are now belt-and-braces,
  but `MemoryNode`'s `handleDelete` short-circuit (skip animation, call
  mutation immediately) still needs the boolean — it would be inconsistent
  to remove the hook from one and not the other.
- **Tailwind `motion-reduce:` classes** on `PageTransition` and
  `MemoryNode`. ADR 7's defense-in-depth fallback for no-JS users; keep.
- **DRY hover-lift class string** in `StatsBar` + `RecentPalaces`. Two
  consumers; below the project's "three or more" abstraction threshold.
  Documented as a deliberate non-fix in the plan; promote to a constant if
  a third consumer appears.

---

## Files

| Action   | File                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Modified | `apps/web/src/shared/components/MotionProvider.tsx`                           |
| Modified | `apps/web/src/features/spatial-canvas/components/nodes/MemoryNode.tsx`        |
| Deleted  | `apps/web/src/shared/hooks/useConfetti.ts`                                    |
| Modified | `apps/web/package.json` (removed `canvas-confetti`, `@types/canvas-confetti`) |

---

## Regression risk

None observed. Typecheck, lint, format, guardrails, and a full
`pnpm turbo build --filter=@memory-palace/web` are clean. All 218 existing
tests pass; no Phase 7 component had tests prior to this pass (animation
behaviour is not assertable in JSDOM). Manual smoke-test contract:

1. Create a node — scale-in animation plays.
2. Delete a node — scale-out animation plays, then the node disappears
   cleanly. Rapid double-click triggers one mutation.
3. With `prefers-reduced-motion: reduce` set in DevTools (Rendering →
   Emulate CSS media): page transitions and node create/delete are instant.
