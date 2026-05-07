# Phase 7 Refactoring Plan — Animations & Polish

**Status:** Pending approval
**Target phase:** 7 only (motion infrastructure, page transition, node animations, confetti hook)
**Constraint anchors:** `CLAUDE.md`, ADR 7
**Prior passes:** ADR 8 deleted the dead `shared/lib/motion.ts` barrel. No other Phase 7 cleanup has been done.

---

## Audit Scope

Files audited (no other files were read):

- `apps/web/src/shared/components/MotionProvider.tsx`
- `apps/web/src/shared/components/PageTransition.tsx`
- `apps/web/src/shared/hooks/useConfetti.ts`
- `apps/web/src/features/spatial-canvas/components/nodes/MemoryNode.tsx`
- `apps/web/src/app/layout.tsx` (consumer of `MotionProvider`)
- `apps/web/src/app/(dashboard)/layout.tsx` (consumer of `PageTransition`)
- `apps/web/src/features/dashboard/components/StatsBar.tsx` + `RecentPalaces.tsx` (Tailwind hover lifts)

Cross-checked: `useConfetti` has zero callers in the repository; `reducedMotion=` never appears as a prop anywhere.

---

## Findings

Five flaws ordered by severity. Two are concrete defects (a documented ADR 7 decision that was never implemented, and a self-coordinating animation timer that drifts), two are idiom/cleanup, one is dead code per `CLAUDE.md`'s "no half-finished implementations" rule.

---

### Finding 1 — `LazyMotion` is missing `reducedMotion="user"` (HIGH, defect)

**File:** `apps/web/src/shared/components/MotionProvider.tsx`

**Problem.** ADR 7 §2 documents a three-layer reduced-motion strategy and explicitly lists "`reducedMotion='user'` prop on `LazyMotion` — library-level, sets all durations to 0 automatically" as the **first** layer. The shipped `MotionProvider` is:

```tsx
<LazyMotion features={domAnimation}>{children}</LazyMotion>
```

The prop is missing. This means the library-level layer is inert — accessibility relies entirely on the per-component `useReducedMotion()` calls (only `PageTransition` and `MemoryNode`) plus a few `motion-reduce:` Tailwind classes. Any future component that uses `m.*` and forgets to call `useReducedMotion()` will animate against the user's preference.

**Fix.**

```tsx
<LazyMotion features={domAnimation} strict reducedMotion="user">
  {children}
</LazyMotion>
```

`strict` is added at the same time because it surfaces accidental imports of the heavyweight `motion` component (vs the LazyMotion-required `m`) at runtime in dev. Currently nothing imports `motion`, so adding `strict` is risk-free and forward-protects the constraint.

**Risk:** None. `reducedMotion="user"` only takes effect when the user has the OS-level preference set, in which case the documented behaviour is to honour it.

---

### Finding 2 — `MemoryNode` exit animation uses `setTimeout` to coordinate with the delete mutation (MEDIUM, defect-adjacent)

**File:** `apps/web/src/features/spatial-canvas/components/nodes/MemoryNode.tsx` lines 75–83

**Problem.**

```ts
const handleDelete = useCallback(async () => {
  if (shouldReduceMotion) {
    onDeleteNode(id);
    return;
  }
  setIsExiting(true);
  await new Promise<void>((resolve) => setTimeout(resolve, 200));
  onDeleteNode(id);
}, [id, onDeleteNode, shouldReduceMotion]);
```

Two related defects:

1. The `200`ms delay is hardcoded and must equal the `transition.duration` for `isExiting` (`0.2` on line 137). Changing one without the other either cuts the animation short or leaves the node visible after it has finished animating. Drift is silent — no test or type catches it.
2. The `setTimeout`-based coordination races with React's render schedule. If the user clicks delete twice in rapid succession or the node is unmounted by another path (remote sync, undo, room switch) before the timeout fires, `onDeleteNode(id)` is still called from a now-orphaned closure. The mutation handler is idempotent (Drizzle returns 0 rows for a deleted id, per ADR 7), so this is not user-visible — but the construct is fragile.

**Fix.** framer-motion's `m.*` accepts an `onAnimationComplete` callback that fires when the transition target is reached. Drive the mutation off the animation event itself, eliminating both the magic number and the race:

```tsx
// Module-level constant — no risk of drift between code paths.
const NODE_VARIANTS = {
  initial: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exiting: { scale: 0.8, opacity: 0 },
} as const;

const ENTER_DURATION = 0.3;
const EXIT_DURATION = 0.2;

// Inside MemoryNode:
const [isExiting, setIsExiting] = useState(false);

const handleDelete = useCallback(() => {
  if (shouldReduceMotion) {
    onDeleteNode(id);
    return;
  }
  setIsExiting(true);
}, [id, onDeleteNode, shouldReduceMotion]);

// In the JSX:
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
  ...
>
```

This cleanly separates concerns: the React state declares intent (`isExiting`), framer-motion drives the visual transition, and the animation engine itself signals completion. No timer; no magic number duplication; identical perceived behaviour.

**Risk:** Low. The `onAnimationComplete` callback fires exactly once per target reached. The hot path (rapid double-click on delete) is now safer: setting `isExiting = true` a second time produces no new animation cycle, no second `onAnimationComplete` event, no double mutation call.

---

### Finding 3 — Variants and inline animate-target are mixed in `MemoryNode` (MEDIUM, idiom)

**File:** `MemoryNode.tsx` lines 63–66 (variants) + 132–138 (m.div props)

**Problem.**

```tsx
const nodeEnterVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
};
// ...
<m.div
  variants={nodeEnterVariants}
  initial="initial"
  animate={isExiting ? { scale: 0.8, opacity: 0 } : 'animate'}
>
```

`animate` here switches between a **literal object** and a **variant name string**. framer-motion supports both forms but mixing them in a single prop is a code smell: a contributor who later adds an `exit` key to `nodeEnterVariants` (the dictionary is named `*Variants`, after all) cannot tell which call sites use variant-name resolution and which use literal targets.

**Fix.** Folded into Finding 2's variant rewrite — adding the `exiting` variant resolves the inconsistency. After the fix, all three states (`initial` / `visible` / `exiting`) are referenced by name; no inline object literals appear in the `animate` prop.

**Risk:** None additional — same change set as Finding 2.

---

### Finding 4 — `useConfetti` has zero callers and ships unused (MEDIUM, dead code per `CLAUDE.md`)

**File:** `apps/web/src/shared/hooks/useConfetti.ts`

**Problem.** ADR 7 §5 states: "No achievement/badge feature exists in the current schema. `useConfetti` is delivered as a ready-to-use primitive for Phase 8+." `CLAUDE.md`'s "Doing tasks" section says: "Don't add features, refactor, or introduce abstractions beyond what the task requires. … No half-finished implementations either." A hook with zero callers, gated behind a feature that doesn't exist yet, is exactly that.

ADR 8 already removed `shared/lib/motion.ts` for the same reason ("documented an intention that was never followed through"). Same standard applies here.

A grep confirms zero callers: only `useConfetti.ts` itself contains the symbol.

**Fix.** Delete `apps/web/src/shared/hooks/useConfetti.ts`. Run `pnpm remove canvas-confetti @types/canvas-confetti --filter web` to drop the orphan dependencies. When Phase 8 actually wires confetti to an achievement event, the hook can be re-added next to its caller (which will be in `features/<achievements>/hooks/`, not in `shared/hooks/`).

ADR 7 will be amended in this pass's ADR with a "Reverted: §5 confetti primitive" note.

**Risk:** None. Zero callers, not part of any user flow.

---

### Finding 5 — Tailwind hover-lift class string duplicated across two cards (LOW, DRY)

**Files:**

- `features/dashboard/components/StatsBar.tsx:12`
- `features/dashboard/components/RecentPalaces.tsx:48`

**Problem.** Both files share the same hover-lift class fragment:

```
transition-all hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0
```

Two consumers in two adjacent dashboard components. ADR 7 §6 documents this as the project-wide hover idiom. The "three or more" abstraction threshold from `CLAUDE.md` has not been crossed (only two consumers), so a `cardHoverLift` helper is **not** warranted yet.

**Fix.** No code change. Documented in this plan to record the deliberate non-extraction so the next contributor doesn't re-litigate. If a third consumer appears (e.g. a `RoomCard` in Phase 8), promote to a `shared/lib/motion-classes.ts` constant at that time.

**Risk:** None — no change.

---

## Out of Scope (deliberately deferred)

- **Migrate `framer-motion` → `motion/react` import path.** framer-motion v12 was rebranded to `motion`; the new canonical import is `motion/react`. The `framer-motion` package continues to re-export the same API and is the version we depend on (`framer-motion@^12.38.0`). Migrating would touch 4 files for zero observable benefit; defer until the package is deprecated.
- **`reducedMotion` propagation through `useReducedMotion()` calls.** With Finding 1 in place, the library handles reduced motion at the root. We are **not** removing the per-component `useReducedMotion()` calls because `MemoryNode`'s `handleDelete` short-circuit (skip animation, call mutation immediately) is still needed regardless of library handling. The hook calls in `PageTransition` become belt-and-braces; harmless.
- **`PageTransition` motion-reduce className** (`motion-reduce:transition-none motion-reduce:animate-none`). With Finding 1 in place, the library zeroes durations automatically. The CSS classes serve as a no-JS fallback per ADR 7's "defense-in-depth" decision; keep.
- **Tests.** No Phase 7 component currently has a test (confirmed by `ls __tests__`). Adding tests is out of scope for a refactor pass — animation behaviour is hard to assert in JSDOM (framer-motion uses `requestAnimationFrame` and pointer events that JSDOM stubs). Visual verification via dev server is the documented contract.
- **MemoryNode complexity / God-component split.** ADR 8 deferred this on similar grounds; not relevant to Phase 7.

---

## Execution Order (if approved)

| #   | Change                                                                                                  | Files                            | Risk |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------- | ---- |
| 1   | Add `reducedMotion="user" strict` to `LazyMotion`                                                       | `MotionProvider.tsx`             | None |
| 2   | Replace `setTimeout(200)` with `onAnimationComplete`; extract duration constants; add `exiting` variant | `MemoryNode.tsx`                 | Low  |
| 3   | Delete unused `useConfetti` hook + drop `canvas-confetti` deps                                          | `useConfetti.ts`, `package.json` | None |

Steps are independent; each lands as a separate commit so any one can be reverted in isolation.

---

## Regression Prevention

- **Type gate:** `pnpm turbo typecheck` after each step.
- **Lint gate:** `pnpm turbo lint` after each step.
- **Test gate:** `pnpm exec vitest run` — 218 tests should remain green (Phase 7 has no tests, so the gate verifies that nothing in adjacent surfaces breaks).
- **Build gate:** `pnpm turbo build --filter=@memory-palace/web` — verifies no SSR breakage from the `MotionProvider` change.
- **Manual smoke test (after step 2):**
  1. Load a room with at least one node. Create a node — scale-in animation plays.
  2. Right-click the node → Delete. The scale-out animation plays, then the node disappears (no flash, no stuck node).
  3. Rapid double-click delete: second click is a no-op; one mutation fires.
  4. With `prefers-reduced-motion: reduce` set in DevTools (Rendering → Emulate CSS media): page transitions are instant, node create/delete are instant, no transforms.
- **Rollback plan:** Each step is a separate commit. `git revert` any one if a regression surfaces.

---

## Approval gate

This plan does not modify any application code yet. Awaiting explicit approval before proceeding to Phase 2 (execute + ADR).
