# ADR 9 — Phase 6 Refactor: Single-Source-of-Truth Command Action Map

**Status:** Accepted
**Date:** 2026-05-07
**Phase:** 6 (third-pass refactor; supersedes ADR 6-R deferral on shortcut-map DRY)

---

## Context

Phase 6 (command palette + global shortcuts) shipped via ADR 6 and was already
revisited twice — ADR 6-R for correctness fixes, ADR 8 for cross-feature DRY
extractions (route regexes, canvas event names). Both prior passes deliberately
left the **action metadata itself** triplicated across the three Phase 6
files, with ADR 6-R's note: "re-evaluate if a fourth consumer appears."

The trigger condition is now distinct from a fourth consumer: a fourth route
(`C N` create-node on a room page) was added late in Phase 6, the canvas group
in `CommandPalette` grew six chord-less canvas events that `ShortcutsOverlay`
also documents, and the visibility-scope predicate (`isOnRoomPage`,
`palaceIdFromPath`) was duplicated between the palette and the shortcuts hook.
The drift surface is materially larger than it was at ADR 6-R time.

---

## Decision

Introduce `apps/web/src/shared/lib/commandActions.ts` as the single source of
truth for every keyboard-driven user action. Each entry colocates:

- A stable `id` (used as cmdk value and as overlay-row key).
- A `group` for palette ordering.
- Static `label` + `icon` (palette) and optional `getLabel` / `getIcon`
  for theme-dependent display.
- A `description` (overlay text; falls back to `label`).
- A `chord` (lowercased keystroke array used by the hook state machine).
- A `keys` array (overlay `<kbd>` tokens) and a `shortcutHint` string
  (cmdk's right-aligned shortcut hint).
- A `scope` (`always` | `on-room` | `on-palace`) — checked once via
  `scopeMatches(scope, pathname)`.
- A `run(ctx)` side-effect runner that receives a typed `CommandRunContext`
  with the dependencies it needs (`router`, `setTheme`, `dispatchCanvas`,
  `signOut`, etc.).

The three Phase 6 consumers become projections of this map:

- **`useGlobalShortcuts`** uses `findChordAction(combo, pathname)` to resolve a
  chord and call `action.run(ctx)`. The hand-rolled `switch` is gone.
- **`CommandPalette`** filters `COMMAND_ACTIONS` by scope, groups by
  `group`, and renders. The inline `useActions` hook with conditional
  spread-arrays is gone.
- **`ShortcutsOverlay`** keeps its curated section structure (the heading
  layout doesn't 1:1 match palette groups) but pulls each action-row's
  `keys` and `description` from the map via `rowFromAction(id)`. Doc-only
  rows (`Esc`, `Space`, `⌘A`, `E`, `/`) stay inline because they have no
  programmatic counterpart.

---

## Why the prior split (`label | (ctx) => string`) was rejected

The first draft typed `label` and `icon` as `string | (ctx) => string` and
`LucideIcon | (ctx) => LucideIcon` to handle the theme-toggle action whose
display flips between Sun/Moon. TypeScript could not narrow the union with
`typeof action.icon === 'function'` because lucide-react's `LucideIcon` is a
`ForwardRefExoticComponent` — itself callable, so `typeof === 'function'` is
true for both branches.

Final shape: `label: string` + `icon: LucideIcon` are required and serve as
defaults; optional `getLabel?` / `getIcon?` overrides supply the dynamic
form. The palette evaluates `action.getLabel?.(ctx) ?? action.label`. This
keeps the type narrow, preserves the dynamic Sun↔Moon swap, and avoids
forcing every static action to wrap its label in a thunk.

---

## Other Phase 6 changes in this pass

### Route helpers in `shared/lib/routes.ts`

`isOnRoomPage(pathname)` and `palaceIdFromPath(pathname)` join the existing
regex constants. The palette and the hook now call the helpers; the regexes
stay exported for any consumer that needs the raw match (`commandActions.ts`
uses `palaceIdFromPath` for create-room).

### Memoized context values

`CommandPaletteProvider` and `ShortcutsOverlayProvider` now wrap their value
objects in `useMemo` and stabilize their open/close handlers with
`useCallback`. Previously every parent render produced a new value identity,
forcing every consumer to re-render — visible under React 19 Strict Mode's
double-invocation. No API change.

### `<span>` → `Fragment` around cmdk groups

`CommandPalette` previously wrapped each `CommandGroup` in a `<span>` to add a
React key while inserting separators between groups. cmdk's group-spacing CSS
(`[cmdk-group]:not([hidden])_~[cmdk-group]`) relies on groups being direct
siblings, which a `<span>` breaks. Replaced with `React.Fragment`, restoring
the sibling chain.

### `useSyncExternalStore` for OS detection

`CommandPaletteDesktopTrigger`'s `⌘K` vs `Ctrl+K` hint previously read
`navigator.platform` inline at render time, with `suppressHydrationWarning` on
the `<kbd>` to mask the SSR/CSR mismatch. The first refactor swapped this for
`useState + useEffect`, which the React 19 ESLint rule
`react-hooks/set-state-in-effect` correctly flags as anti-pattern. The
canonical solution is `useSyncExternalStore` with three callbacks: a no-op
subscribe (the value never changes after first read), a client snapshot that
reads `navigator`, and a server snapshot that returns `false` so the initial
client render matches the server. After hydration, React re-renders with the
true client snapshot — no warning, no flash, no rule violation.

---

## Files

| Action   | File                                                         |
| -------- | ------------------------------------------------------------ |
| Created  | `apps/web/src/shared/lib/commandActions.ts`                  |
| Modified | `apps/web/src/shared/lib/routes.ts`                          |
| Modified | `apps/web/src/shared/components/CommandPalette.tsx`          |
| Modified | `apps/web/src/shared/components/CommandPaletteContext.tsx`   |
| Modified | `apps/web/src/shared/components/CommandPaletteTrigger.tsx`   |
| Modified | `apps/web/src/shared/components/ShortcutsOverlay.tsx`        |
| Modified | `apps/web/src/shared/components/ShortcutsOverlayContext.tsx` |
| Modified | `apps/web/src/shared/hooks/useGlobalShortcuts.ts`            |

---

## Out of scope

- **Collapsing the two contexts** (`CommandPaletteContext` +
  `ShortcutsOverlayContext`) into one. With memoized values the perf rationale
  for the split (per ADR 6) holds; merging would be churn.
- **Removing `AppCommandProvider.GlobalShortcutsMount`.** The "dummy" child is
  the minimum-indirection way to call `useGlobalShortcuts` inside both
  providers. Inlining would force a third wrapper component.
- **Phase 7 / canvas / animations.** None touched.

---

## Regression risk

None observed. All 218 existing tests pass unchanged; typecheck, lint,
format-check, guardrails, and a full `pnpm turbo build` are clean.

The hook never invokes the `sign-out` action — that action has no chord, so
`findChordAction` cannot return it. The hook supplies `signOut: () => {}` in
its run context to make this unreachable branch typecheck without pulling
`signOut` (and thereby `env.ts`) into the test harness's eager-load graph.
