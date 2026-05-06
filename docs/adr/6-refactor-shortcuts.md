# ADR 6-R — Phase 6 Refactor: Keyboard Shortcut Correctness & Accessibility

**Status:** Accepted  
**Phase:** 6 (refactor pass)  
**Date:** 2026-05-06

---

## Context

A post-implementation audit of Phase 6 (Command Palette & Global Shortcuts) identified four
correctness and accessibility issues. None required architectural change; all were targeted,
minimal fixes.

---

## Issues Found & Fixes Applied

### 1. G-key conflict — canvas snap vs. global prefix (Critical)

**Flaw:** `RoomCanvas` registered a `window` bubble-phase `keydown` listener for `'G'` (toggle snap).
`useGlobalShortcuts` registered a `document` bubble-phase `keydown` listener that arms a prefix
window on `'G'`. Event propagation order is `… → document → window`, so the global handler fired
**first** — arming the prefix — and the canvas handler fired second. A user on a canvas page
pressing `G` (to toggle snap) would silently arm the prefix window; a subsequent `H` within one
second would navigate to `/` instead of doing nothing.

**Fix:** Changed the canvas handler from `window.addEventListener('keydown', …)` to
`document.addEventListener('keydown', …, { capture: true })`. Capture-phase listeners on
`document` fire before any bubble-phase listener, including `useGlobalShortcuts`. The handler
also calls `e.stopPropagation()` after matching `G`, so the global prefix is never armed while
the canvas is mounted.

**Why not the inverse?** Moving the global handler to capture would break the existing tests,
which fire `document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))` — a
dispatch that skips capture-phase listeners registered on `document` itself (capture only applies
when the event descends through ancestors). Keeping the global handler as-is and only upgrading
the canvas handler is the minimal, non-breaking fix.

### 2. Missing F-key (fit view) shortcut (High)

**Flaw:** `ShortcutsOverlay` documented `F` → "Fit all nodes in view" in the Canvas section, but
no code path handled the `F` key. The `fitView` function was already available inside
`InnerCanvas` (destructured from `useReactFlow()`), and the FAB already invoked it. The
shortcut was simply never wired.

**Fix:** Added an `else if (e.key === 'f' || e.key === 'F')` branch inside the same canvas
capture-phase handler introduced in fix 1. Added `fitView` to the effect dependency array.

### 3. FAB menu not keyboard-dismissible (High)

**Flaw:** The mobile `CanvasFab` expanded an action menu (`role="menu"`) on click but had no
`Escape` key handler. Keyboard-only users and screen-reader users could not dismiss the menu
without clicking outside it, violating WCAG 2.1 Success Criterion 1.4.13 (Content on Hover or
Focus) and the general modal-close convention.

**Fix:** Added a `useEffect` inside `CanvasFab` that attaches a `keydown` listener on
`document` when `open === true` and removes it when `open` becomes `false` or the component
unmounts. The listener calls `setOpen(false)` on `Escape`. The effect guard (`if (!open) return`)
ensures the listener is attached only while the menu is visible, avoiding unnecessary overhead.

### 4. Magic number 1000 in prefix-key timeout (Low)

**Flaw:** `useGlobalShortcuts` called `setTimeout(clearPrefix, 1000)`. The bare integer carried
no explanation of the UX rationale — reviewers had to guess whether the value was arbitrary or
tuned.

**Fix:** Extracted `const PREFIX_TIMEOUT_MS = 1_000` at module scope with a JSDoc comment
explaining the tradeoff: long enough for deliberate two-key chords; short enough that a
mistakenly armed prefix does not linger.

### 5. OS-aware ⌘K / Ctrl+K hint (Low)

**Flaw:** `CommandPaletteDesktopTrigger` always rendered `⌘K` regardless of platform. Windows
and Linux users saw an incorrect hint (the actual shortcut `Ctrl+K` works, but the label said
`⌘K`).

**Fix:** Added platform detection using the modern `navigator.userAgentData.platform` API with
a fallback to the deprecated (but universally supported) `navigator.platform`. The hint now
renders `⌘K` on macOS and `Ctrl+K` elsewhere. `suppressHydrationWarning` on the `<kbd>` element
handles the intentional server/client mismatch: the server returns `Ctrl+K` (safe default when
`navigator` is undefined) and the client corrects it on hydration without a visible flash, since
the element is `md:flex` (desktop-only) and the text is secondary UI.

---

## Consequences

- **Positive:** Canvas `G` shortcut no longer races against global prefix arming. Users on a
  canvas page get deterministic snap-toggle behaviour.
- **Positive:** `F` for fit view is now functional, matching what the shortcuts overlay documents.
- **Positive:** The FAB menu is keyboard-dismissible, satisfying the basic keyboard-nav
  contract for menu widgets.
- **Positive:** Windows/Linux users see the correct keyboard hint.
- **No regressions:** All 218 existing tests pass. TypeScript strict mode passes with no errors.
- **Deferred:** A shared `SHORTCUT_MAP` constant (to DRY up `useGlobalShortcuts`,
  `CommandPalette`, and `ShortcutsOverlay`) was considered but deferred. The three files are
  small and independently maintained; the abstraction would save ~20 lines at the cost of an
  additional indirection layer. Re-evaluate if a fourth consumer appears.
