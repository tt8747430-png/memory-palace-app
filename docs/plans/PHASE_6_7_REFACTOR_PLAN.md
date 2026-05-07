## Remains

- **`InnerCanvas` God Component extraction** — the component is large (~450 lines) but each `useEffect` block has distinct dependencies and captures distinct mutation refs. Splitting it would require threading refs across hook boundaries, adding indirection with no observable simplification. Deferred to Phase 8 refactor if the file grows further.
- **Context duplication (`CommandPaletteContext` vs `ShortcutsOverlayContext`)** — two instances do not meet the "three or more" threshold for a shared abstraction per `CLAUDE.md`.
- **`handleDelete` async/Promise pattern in `MemoryNode`** — the ADR explicitly documents this design choice and its edge-case handling. No change warranted.
- Tab switch underline (`layoutId`) — deferred to when tabbed navigation exists
- Flashcard 3D flip — no flashcard feature built yet
- Pull-to-refresh — no native mobile app; browser pull-to-refresh not in scope
- Streak pulse glow — no streak/badge feature in current schema
- `canvas-confetti` trigger point — the `useConfetti` hook is built but not wired to any achievement event (no badge/achievement feature exists yet); it is provided as a ready-to-use primitive

- **Migrate `framer-motion` → `motion/react` import path.** framer-motion v12 was rebranded to `motion`; the new canonical import is `motion/react`. The `framer-motion` package continues to re-export the same API and is the version we depend on (`framer-motion@^12.38.0`). Migrating would touch 4 files for zero observable benefit; defer until the package is deprecated.
- **`reducedMotion` propagation through `useReducedMotion()` calls.** With Finding 1 in place, the library handles reduced motion at the root. We are **not** removing the per-component `useReducedMotion()` calls because `MemoryNode`'s `handleDelete` short-circuit (skip animation, call mutation immediately) is still needed regardless of library handling. The hook calls in `PageTransition` become belt-and-braces; harmless.
- **`PageTransition` motion-reduce className** (`motion-reduce:transition-none motion-reduce:animate-none`). With Finding 1 in place, the library zeroes durations automatically. The CSS classes serve as a no-JS fallback per ADR 7's "defense-in-depth" decision; keep.
- **Tests.** No Phase 7 component currently has a test (confirmed by `ls __tests__`). Adding tests is out of scope for a refactor pass — animation behaviour is hard to assert in JSDOM (framer-motion uses `requestAnimationFrame` and pointer events that JSDOM stubs). Visual verification via dev server is the documented contract.
- **MemoryNode complexity / God-component split.** ADR 8 deferred this on similar grounds; not relevant to Phase 7.

- **`AppCommandProvider`'s `GlobalShortcutsMount` "dummy" child.** The pattern is uncommon but justified — `useGlobalShortcuts` needs both contexts at once, and inlining the hook into `AppCommandProvider` itself would require nesting the providers in a third component. Two providers + one mount component is the minimum-indirection version. No change.
- **Collapsing `CommandPaletteContext` + `ShortcutsOverlayContext` into one `useReducer`.** ADR 6 chose to split them precisely to avoid coupling re-renders. With Finding 3's memoization fix, the split is no longer a perf concern; merging them would be churn for no observable benefit. No change.
- **`useTransition` for sign-out in `CommandPalette.tsx` line 57.** The transition wrapping is correct — `signOut` is an async server action and the transition prevents the click handler from blocking the palette close animation. Keep.
- **Phase 7 animations**, ADR 8 follow-ups, and any canvas-feature changes. Not Phase 6.
- **Pulling `react-hotkeys-hook`** as the canvas-shortcut library. ADR 6 documents the intent to use it for canvas-local single-key shortcuts. Not in this refactor's scope.

- **Highlighting the specific node** when navigating from palette search results (would need `?node=<id>` URL handling in `RoomCanvas`, plus a Zustand `focusNodeId` slice). Two-step lookup not required for the consolidation goal.
- **Removing per-component `useReducedMotion()` calls** — see ADR 10 §"Out of scope".
- **`CanvasFab` / `CanvasToolbar` consolidation** — intentional dual-surface (mobile/desktop), not duplication.
- **Pane context menu** in `RoomCanvas` consolidation with `commandActions.ts` Canvas group — would require a generic menu renderer; the three palette-actions ↔ four pane-menu items overlap is too small to justify the abstraction now.
- **`isInputFocused()` extraction** — two consumers; below threshold.
