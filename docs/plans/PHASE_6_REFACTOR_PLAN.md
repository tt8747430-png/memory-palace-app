# Phase 6 Refactoring Plan — Command Palette & Global Shortcuts

**Status:** Pending approval
**Target phase:** 6 only (command palette, shortcuts overlay, global shortcuts)
**Constraint anchors:** `CLAUDE.md`, ADR 6, ADR 6-R, ADR 8
**Prior passes:** ADR 8 already extracted route regexes, canvas event names, and removed dead code. ADR 6-R fixed correctness issues (G-key conflict, F shortcut, Esc on FAB, OS-aware hint). This plan addresses what those passes **deliberately deferred or did not touch**.

---

## Audit Scope

Files audited (no other files were read):

- `apps/web/src/shared/components/CommandPalette.tsx`
- `apps/web/src/shared/components/CommandPaletteContext.tsx`
- `apps/web/src/shared/components/CommandPaletteTrigger.tsx`
- `apps/web/src/shared/components/AppCommandProvider.tsx`
- `apps/web/src/shared/components/ShortcutsOverlay.tsx`
- `apps/web/src/shared/components/ShortcutsOverlayContext.tsx`
- `apps/web/src/shared/hooks/useGlobalShortcuts.ts`
- `apps/web/src/shared/lib/canvasEvents.ts`
- `apps/web/src/shared/lib/routes.ts`

---

## Findings

Five flaws ordered by severity. Two are DRY violations the prior ADRs explicitly deferred but now meet the "third consumer" threshold; three are smaller correctness/idiom fixes.

---

### Finding 1 — Shortcut metadata triplicated across three files (HIGH, DRY)

**Files:**

- `useGlobalShortcuts.ts` lines 88–115 (chord switch)
- `CommandPalette.tsx` lines 70–239 (palette action groups)
- `ShortcutsOverlay.tsx` lines 22–63 (overlay rows)

**Problem.** Each chord (`g h`, `g p`, `g s`, `c p`, `c r`, `c n`, `t d`) is declared three times:

1. `useGlobalShortcuts.ts` knows the keystrokes and the action (router push or canvas event).
2. `CommandPalette.tsx` knows the same action plus a label and an icon.
3. `ShortcutsOverlay.tsx` knows the same keystrokes plus a description.

The three files must agree on three things — the keystroke, the navigation target, and the visibility scope (e.g. `C N` is only valid on a room page, `C R` only on a palace page) — and nothing checks that they do. Adding a new action requires editing three files; renaming a keystroke or moving a route requires editing three files.

ADR 6-R deferred this with the rationale "three small files independently maintained, abstraction would save ~20 lines at the cost of an additional indirection layer; re-evaluate if a fourth consumer appears." The trigger condition I am invoking is different: a **fourth route** (`C N` on canvas) was added in Phase 6's later commits, the _Canvas_ group in `CommandPalette` now contains six chord-less canvas events that `ShortcutsOverlay`'s "Canvas" section also lists, and the visibility-scope predicate (`isOnRoomPage`, `palaceIdFromPath`) is itself duplicated between palette and shortcuts hook. The drift surface is larger than at ADR 6-R time.

**Fix.** Create one source of truth: `apps/web/src/shared/lib/commandActions.ts`.

```ts
import type { LucideIcon } from 'lucide-react';
import type { Router } from 'next/router';
import { CANVAS_EVENTS } from './canvasEvents';
import { PALACE_PAGE_RE, ROOM_ROUTE_RE, palaceIdFromPath, isOnRoomPage } from './routes';

export type CommandScope = 'always' | 'on-room' | 'on-palace';

export interface CommandAction {
  /** Stable id used as React key and cmdk value. */
  id: string;
  group: 'Navigate' | 'Create' | 'Canvas' | 'Tools';
  label: string;
  description: string; // Used by ShortcutsOverlay
  icon: LucideIcon; // Used by CommandPalette
  /** Keystroke representation for the chord state machine, e.g. ['g','h']. Empty for canvas-only. */
  chord: readonly string[];
  /** Display string for cmdk shortcut hint, e.g. 'G H' or '⌘D'. */
  shortcutHint?: string;
  scope: CommandScope;
  /** Side-effect runner. Receives the dependencies it needs. */
  run: (ctx: CommandRunContext) => void;
}

export interface CommandRunContext {
  router: { push: (href: string) => void };
  pathname: string;
  setTheme: (t: 'dark' | 'light') => void;
  resolvedTheme: 'dark' | 'light' | 'system' | undefined;
  openOverlay: () => void;
  signOut: () => void;
  /** Dispatches a CANVAS_EVENTS.* CustomEvent on `window`. */
  dispatchCanvas: (name: (typeof CANVAS_EVENTS)[keyof typeof CANVAS_EVENTS]) => void;
}

export const COMMAND_ACTIONS: readonly CommandAction[] = [
  // Navigate
  {
    id: 'go-home',
    group: 'Navigate',
    label: 'Go Home',
    description: 'Go Home',
    icon: Home,
    chord: ['g', 'h'],
    shortcutHint: 'G H',
    scope: 'always',
    run: ({ router }) => router.push('/'),
  },
  // ...etc
];
```

`useGlobalShortcuts.ts` becomes a 30-line state machine that:

1. Maps `prefixKey + key` → `COMMAND_ACTIONS.find(a => a.chord.join('') === combo && scopeMatches(a.scope, pathname))`.
2. Calls `action.run(ctx)`.

`CommandPalette.tsx` becomes a `groupBy(COMMAND_ACTIONS.filter(scopeMatches), 'group')` + render. `useActions` collapses to a 5-line `useMemo` of filtered actions.

`ShortcutsOverlay.tsx` becomes a `groupBy(COMMAND_ACTIONS, 'group')` + render of `{ description, chord }`. The static `Esc`/`Space`/`/`/`E`/`Del`/`⌘A` rows that have no programmatic counterpart stay as a small static `DOC_ONLY_SHORTCUTS` array — they document canvas-internal bindings that don't go through this map.

**LoC delta (estimated):** −60 net (three files lose duplication, one new file at ~120 lines).

**Risk:** Low-Medium. Existing tests cover palette rendering, overlay rendering, and shortcut firing. The action set and behaviour do not change.

---

### Finding 2 — Path-matching duplicated between palette and shortcut hook (MEDIUM, DRY)

**Files:**

- `CommandPalette.tsx` lines 58–60 — `ROOM_ROUTE_RE.test(pathname)`, `PALACE_PAGE_RE.exec(pathname)?.[1] ?? null`
- `useGlobalShortcuts.ts` lines 102, 107 — same two checks

**Problem.** Both consumers reach into raw regex objects and reimplement the same match-and-extract. ADR 8 centralized the regex constants but stopped there. The two predicates `isOnRoomPage(pathname)` and `palaceIdFromPath(pathname)` are now declared inline twice with identical semantics.

**Fix.** In `apps/web/src/shared/lib/routes.ts`, export two helpers next to the existing constants:

```ts
export function isOnRoomPage(pathname: string): boolean {
  return ROOM_ROUTE_RE.test(pathname);
}

export function palaceIdFromPath(pathname: string): string | null {
  return PALACE_PAGE_RE.exec(pathname)?.[1] ?? null;
}
```

Both consumers import the helpers; the regex constants stay exported (Finding 1's `commandActions.ts` will use them).

**Risk:** None. Pure rename + extract.

---

### Finding 3 — Context value objects rebuilt every render (MEDIUM, perf/idiom)

**Files:**

- `CommandPaletteContext.tsx` lines 17–28
- `ShortcutsOverlayContext.tsx` lines 17–22

**Problem.** Both providers construct the context value as an object literal inside the JSX:

```tsx
<CommandPaletteContext.Provider
  value={{ open, setOpen, openPalette: () => setOpen(true), closePalette: () => setOpen(false) }}
>
```

Every parent render produces a new object identity, even when `open` has not changed. Every consumer (`CommandPalette`, `CommandPaletteTrigger`, `CommandPaletteDesktopTrigger`, `useGlobalShortcuts`) re-renders on every parent render. With React 19's stricter Strict-Mode double-renders this is observable in DevTools as redundant work.

**Fix.** Stabilize the value with `useMemo`, and stabilize `openPalette` / `closePalette` with `useCallback`. `setOpen` from `useState` is already stable so it can be referenced directly:

```tsx
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);
  const value = useMemo<CommandPaletteContextValue>(
    () => ({ open, setOpen, openPalette, closePalette }),
    [open, openPalette, closePalette],
  );
  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}
```

Same shape for `ShortcutsOverlayProvider`.

**Note on React 19 `use(Context)`.** Migrating consumers from `useContext(...)` to `use(...)` is **not** recommended here. `use` is intended for cases where context is read conditionally (inside an `if`); the existing top-level `useContext` calls in `useCommandPalette()` and `useShortcutsOverlay()` are the correct idiom. No change.

**Risk:** None. Pure perf hygiene.

---

### Finding 4 — `<span>` used as a fragment around cmdk groups (LOW, semantic/a11y)

**File:** `CommandPalette.tsx` lines 263–276

**Problem.**

```tsx
{
  groups.map((group, groupIdx) => (
    <span key={group.group}>
      {groupIdx > 0 && <CommandSeparator />}
      <CommandGroup heading={group.group}>...</CommandGroup>
    </span>
  ));
}
```

`<span>` is an inline element being used as a group container around block-level cmdk descendants. It defeats cmdk's CSS sibling selectors (the `[cmdk-group]:not([hidden])_~[cmdk-group]` rule on the `Command` className was written assuming groups are direct siblings — wrapping each group in a span breaks the sibling chain). It also adds a useless layout box around every group.

**Fix.** Replace with `React.Fragment` so cmdk sees groups as direct children:

```tsx
import { Fragment } from 'react';
// ...
{
  groups.map((group, groupIdx) => (
    <Fragment key={group.group}>
      {groupIdx > 0 && <CommandSeparator />}
      <CommandGroup heading={group.group}>...</CommandGroup>
    </Fragment>
  ));
}
```

**Risk:** Low. cmdk's group-spacing CSS rule will start applying correctly; visually this is a small spacing change that may be invisible because the className already includes `[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0`. Verify by running the dev server and opening the palette.

---

### Finding 5 — OS detection runs at render time with a hydration shim (LOW, idiom)

**File:** `CommandPaletteTrigger.tsx` lines 33–53

**Problem.** `isMac` is computed inline during render via `typeof navigator !== 'undefined' && /mac/i.test(...)`. Because the server renders `false` (no `navigator`) and the client may render `true`, the code uses `suppressHydrationWarning` on the `<kbd>`. ADR 6-R explicitly chose this approach as a minimal fix, accepting the hydration mismatch.

A cleaner React 19 pattern is to start with the server-safe value and update it in an effect. This eliminates the need for `suppressHydrationWarning` and avoids any flash:

```tsx
const [isMac, setIsMac] = useState(false);
useEffect(() => {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform;
  setIsMac(/mac/i.test(platform));
}, []);
```

This is one extra render on the client, but it removes the hydration-warning suppression and its visual cost is zero on a `md:flex` (desktop-only) trigger that is sized by content not by the kbd width.

**Fix.** Replace the inline expression with the `useState + useEffect` pattern; remove `suppressHydrationWarning`.

**Risk:** Low. Behaviour identical for the user; one extra paint after hydration.

---

## Out of Scope (deliberately deferred)

- **`AppCommandProvider`'s `GlobalShortcutsMount` "dummy" child.** The pattern is uncommon but justified — `useGlobalShortcuts` needs both contexts at once, and inlining the hook into `AppCommandProvider` itself would require nesting the providers in a third component. Two providers + one mount component is the minimum-indirection version. No change.
- **Collapsing `CommandPaletteContext` + `ShortcutsOverlayContext` into one `useReducer`.** ADR 6 chose to split them precisely to avoid coupling re-renders. With Finding 3's memoization fix, the split is no longer a perf concern; merging them would be churn for no observable benefit. No change.
- **`useTransition` for sign-out in `CommandPalette.tsx` line 57.** The transition wrapping is correct — `signOut` is an async server action and the transition prevents the click handler from blocking the palette close animation. Keep.
- **Phase 7 animations**, ADR 8 follow-ups, and any canvas-feature changes. Not Phase 6.
- **Pulling `react-hotkeys-hook`** as the canvas-shortcut library. ADR 6 documents the intent to use it for canvas-local single-key shortcuts. Not in this refactor's scope.

---

## Execution Order (if approved)

| #   | Change                                                         | Files                                                      | Risk       |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| 1   | Add `palaceIdFromPath` / `isOnRoomPage` helpers                | `routes.ts`, `CommandPalette.tsx`, `useGlobalShortcuts.ts` | None       |
| 2   | Memoize context values & callbacks                             | `CommandPaletteContext.tsx`, `ShortcutsOverlayContext.tsx` | None       |
| 3   | Replace `<span>` with `Fragment` in palette group map          | `CommandPalette.tsx`                                       | Low        |
| 4   | Replace render-time OS detection with `useState + useEffect`   | `CommandPaletteTrigger.tsx`                                | Low        |
| 5   | Introduce `commandActions.ts`; refactor 3 consumers to read it | `commandActions.ts` (new), 3 files                         | Low–Medium |

Steps 1–4 are independent and trivially reversible. Step 5 (the largest change) lands last so the smaller fixes are committable on their own if step 5 reveals a snag.

---

## Regression Prevention

- **Existing tests:** `CommandPalette.test.tsx`, `ShortcutsOverlay.test.tsx`, `useGlobalShortcuts.test.tsx` all cover the user-visible behaviour. Run `pnpm turbo test` before each step and after step 5.
- **Type gate:** `pnpm turbo typecheck` after every step.
- **Lint gate:** `pnpm turbo lint` (eslint-plugin-boundaries enforces no cross-feature imports — `commandActions.ts` lives in `shared/lib/` so all consumers can import it).
- **Manual smoke test after step 5:**
  1. Press `Cmd/Ctrl+K`, palette opens, all groups visible.
  2. On a room page, "Canvas" group renders; on `/palaces`, only "Navigate", "Create", "Tools".
  3. `g h`, `g p`, `g s`, `c p`, `t d` all navigate / toggle.
  4. On a palace page, `c r` navigates with `?action=create-room`; off it, no-op.
  5. On a room page, `c n` dispatches `canvas:create-node`; off it, no-op.
  6. `?` opens the shortcuts overlay; the listed chords match what actually fires.
- **Rollback plan:** Each step is a separate commit. `git revert` any single commit if a regression surfaces.

---

## Approval gate

This plan does not modify any application code yet. Awaiting explicit approval before proceeding to Phase 2 (execute + ADR).
