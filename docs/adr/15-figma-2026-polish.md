# ADR 15: Figma 2026 polish — pure-SVG chart family, KPI tiles, slide-to-confirm

**Status:** Accepted
**Date:** 2026-05-11
**Plan:** [`docs/plans/IMPLEMENTATION_APP_PLAN_FIGMA.md`](../plans/IMPLEMENTATION_APP_PLAN_FIGMA.md)

## Context

A batch of 15 Figma references (`BeginnerUI`, `ColorsThatRuin`, `Dashboard UI`,
`Design_2026`, `EveryUIConcept`, `Financial Dashboard`, `Micro_Dashboad`,
`MobileUI`, `Sidebar Tutorial`, `Software_Sections`, `SoftwareColors`,
`SwipeAnimation_Mobile`, `UI_Elements`, `VibeCodedSaas`, `VibeCoding_Results`)
was provided as design inspiration. Phase 1 produced a per-pattern audit
(`docs/plans/IMPLEMENTATION_APP_PLAN_FIGMA.md`) which mapped 16 distinct
patterns (M1–M16) to 7 PR-shaped slices (A–G).

This ADR records the cross-cutting architectural decisions that result, so
future contributors don't re-derive them from individual slice commits.

## Decision

### 1. Pure-SVG chart family is the only chart family

ADR 9B already forbade Recharts / D3. Slices A–C extend that rule into a
**positive primitive family** living under `apps/web/src/shared/components/`:

| Primitive                                                               | Purpose                                                            | Slice        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------ |
| [`Sparkline`](../../apps/web/src/shared/components/Sparkline.tsx)       | inline 1-line trend                                                | pre-existing |
| [`AreaChart`](../../apps/web/src/shared/components/AreaChart.tsx)       | weekly activity tile w/ hover tooltip pill rendered inside the SVG | A            |
| [`MasteryRings`](../../apps/web/src/shared/components/MasteryRings.tsx) | concentric SVG rings for 4-bucket mastery breakdown                | C            |
| [`ArcDonut`](../../apps/web/src/shared/components/ArcDonut.tsx)         | 240° sweep donut for "due / total" progress                        | C            |

All four follow the same rules:

- **`currentColor` for every stroke and fill.** Color is set via Tailwind text
  tokens (`text-emerald-500`, `text-primary`). This makes dark/light/high-contrast
  themes work without per-component branching.
- **`viewBox` based on a fixed unit grid** (typically `0 0 100 100` or `100 32`).
  Width/height props scale via `preserveAspectRatio`, so a single primitive
  handles every size at every breakpoint.
- **No external dependencies.** Bundle stays at the same size; Lighthouse budgets
  (`lighthouse-budget.json`) remain unchanged.
- **Tooltip / hover affordances are rendered inside the same SVG** (see
  `AreaChart`'s `TooltipPill`), so they auto-clamp to the chart bounds and respect
  reduced-motion via the global `MotionConfig`.

### 2. `KpiTile` is the canonical bento cell

Slice A introduced [`KpiTile`](../../apps/web/src/shared/components/KpiTile.tsx)
as a shared primitive: eyebrow label + value + caption + optional `spark`
slot + optional `DeltaChip`. It supports four tones (`neutral | success |
warning | primary`) and degrades to a Next.js `<Link>` when `href` is
provided.

Subsequent dashboards (palaces, rooms, practice, journey) MUST use `KpiTile`
for any "value tile" shape. The previous local `CountTile` / `StatTile` helpers
are deleted on sight when their owning component is touched.

### 3. Sidebar = switcher · quick-actions · pill nav · footer

The dashboard sidebar (Slice B) collapses to a four-zone shell:

1. [`WorkspaceSwitcher`](../../apps/web/src/features/dashboard/components/WorkspaceSwitcher.tsx) — hash-avatar + display name + email + chevron. Inert until multi-workspace ships.
2. [`QuickActionsRow`](../../apps/web/src/features/dashboard/components/QuickActionsRow.tsx) — persistent `⌘K` affordance pinned at the top of the nav, dispatches `useCommandPalette().openPalette()`.
3. Nav with **pill-selected** active rows (`rounded-xl bg-muted/70 shadow-sm`, icon tinted `text-primary` with `strokeWidth=2.25` when active).
4. Footer with `ProfileMenu` + `ModeToggle`.

The footer-only `CommandPaletteDesktopTrigger` is dead; the keyboard shortcut
still works because `useGlobalShortcuts` handles `Cmd/Ctrl+K`.

### 4. Slide-to-confirm is built on framer-motion `drag="x"`

[`SlideToConfirm`](../../apps/web/src/shared/components/SlideToConfirm.tsx)
reuses the framer-motion already installed for `useSwipeNavigation`. **No new
dependency** (no `react-swipeable`, no `@use-gesture/react`). The thumb is an
`<m.button drag="x" dragConstraints={trackRef} dragElastic={0} dragMomentum={false}>`;
release at ≥92% travel fires `onConfirm`, otherwise spring-snaps back.

Reduced motion is honored via the global `MotionConfig reducedMotion="user"` —
no JS `useReducedMotion()` checks.

### 5. `getPracticeStats` extends additively

Slice C added a `mastery: { mastered, familiar, learning, fresh, total }`
breakdown to `getPracticeStats`. Derived in the same `Promise.all` block from
`nodeReviewState.mastery` thresholds (`>=80`, `>=50`, `>=20`, `<20`). No new
round-trip, no schema change.

This sets the precedent: **stats actions extend their return type additively
when adding new tiles**; we do not create per-tile actions.

### 6. EmptyState is dashed-border + circular icon tile

The new shape (dashed border, circular icon background) from Figma
`Design_2026/Home — Empty` and `MobileUI/Home — Empty State` is now the
canonical empty state. Slice A updated `EmptyState` once; every consumer
(palaces, rooms, nodes, recent palaces, weakest nodes) inherits automatically.

### 7. BottomNav active state is a filled circular indicator

Slice A reshaped `BottomNav`: each icon sits inside an `h-9 w-9 rounded-full`
wrapper that gets `bg-primary/12` while active. This matches the
`MobileUI/Home - Bottom - Focused` Figma references and is more accessible
than the previous color-only state change.

## Consequences

- **Bundle stays flat.** No new deps; pure-SVG primitives are tiny.
- **Theming is automatic** because every primitive uses `currentColor`.
- **Per-feature chart code is forbidden.** Any new chart shape must be added to
  the shared primitive family with the same rules.
- **Backwards compatibility was explicitly waived** for this batch — removed
  local helpers (`CountTile`), removed unused exports (`CommandPaletteDesktopTrigger`),
  and reshaped public component APIs in the same commits that touched their
  call sites.

## References

- [Plan](../plans/IMPLEMENTATION_APP_PLAN_FIGMA.md)
- [ADR 9B — Practice stats / SR engine](./9b-journey-stats-undo.md)
- [UI style guide § Figma 2026 polish](../archive/UI_STYLE_GUIDE-aspirational.md)
- [Performance posture § Figma 2026 polish](../archive/PERFORMANCE-aspirational.md)
