# ADR 11 — UX Consolidation and Bug Fixes

**Status:** Accepted  
**Date:** 2025  
**Phase:** Post-7 (UX_AND_BUG_PLAN.md execution)

## Context

After completing Phases 6 and 7, an audit (`UX_AND_BUG_PLAN.md`) identified three
categories of issues:

1. **Ghost dialogs (B1):** `CreatePalaceDialog` and `CreateRoomDialog` opened then
   immediately dismissed due to `?action=create` query param being processed and
   URL-stripped in a `useEffect`. In React 19 Strict Mode + Suspense, the component
   mounted, the effect ran (`setUserOpen(true)`), then the navigation (`router.replace`)
   caused a Suspense remount where the URL was already stripped — leaving `autoOpen=false`
   on the fresh mount. Net result: the dialog flashed open then closed.

2. **Animation flickering (B2):** `displayNodes` was recomputed as an inline expression
   on every render of `RoomCanvas`. React Flow compared node objects by reference to
   decide whether to restart CSS transitions. Any parent re-render (canvas store ping,
   TanStack Query background refetch) produced new object identities, causing opacity
   transition restarts and visible flicker.

3. **Snap-to-grid instability (B3):** Same root cause as B2 — new node object identities
   on every render broke React Flow's internal position stream when `snapToGrid` was
   active, causing nodes to "snap" unpredictably on re-renders unrelated to drag.

4. **Duplicate search surface (A):** A standalone `SearchDialog` existed alongside
   `CommandPalette`, adding a second keybinding, a second UI entry point, and a
   second pass of the `searchNodes` server action threading. The two were inconsistent
   in result formatting and navigation.

## Decisions

### A — Omnibar: merge SearchDialog into CommandPalette

`SearchDialog` is deleted. `CommandPalette` gains an `inputValue` / `deferredQuery`
state pair. When `deferredQuery` is non-empty, a 200 ms debounced effect calls the
`searchNodes` server action and renders a `<CommandGroup heading="Nodes">` above the
existing action groups. `shouldFilter={!hasQuery}` prevents cmdk's built-in fuzzy
filter from competing with the FTS results.

`SearchContext` (`shared/components/SearchContext.tsx`) bridges the server action into
the client without a cross-feature import: `dashboard/layout.tsx` passes `searchNodes`
as a prop; the context makes it available to `CommandPalette`.

The `onSearch` prop chain (`DashboardShell → Sidebar → MobileDrawer`) is removed.

### B1 — Ghost dialog: AppDialogContext

A new `AppDialogContext` (`shared/components/AppDialogContext.tsx`) holds a single
`pending: DialogId | null` value. Dialogs are opened by calling
`openDialog('create-palace' | 'create-room')`; closing calls `consume()`, which sets
`pending = null`.

`CreatePalaceDialog` and `CreateRoomDialog` now control their `open` prop entirely
via context (`isOpen = pending === 'create-palace'`), with no local open state and
no `useEffect`. The trigger `<Button>` calls `openDialog(...)` on click; the Radix
`onOpenChange(false)` callback calls `consume()`. This is immune to Strict Mode
double-invocation and Suspense remounts because context state is external to the
component tree being remounted.

`EmptyStateCreateButton` is a thin client component that calls `openDialog(dialogId)`
without rendering a second dialog instance. The pages no longer parse `?action=`.

### B2+B3 — Node identity stability: useMemo

`displayNodes` in `RoomCanvas` is now wrapped in `useMemo([nodes, canvasSearchQuery])`.
This ensures node objects are only reconstructed when the search query or the
underlying data actually changes, preserving reference identity across unrelated
re-renders. Both the animation flicker and the snap-to-grid instability are resolved
by this single change.

The `useMemo` is placed before the `if (isLoading) return <CanvasLoadingSkeleton />`
early return to satisfy `react-hooks/rules-of-hooks`.

## Consequences

- `SearchDialog.tsx` is permanently deleted.
- `?action=create` query params are no longer read anywhere; existing bookmarks / links
  with that param are silently ignored.
- All dialog triggers in the command palette, shortcuts handler, and EmptyState
  go through `AppDialogContext.open()`.
- Node CSS opacity transitions are stable; snap-to-grid behaves correctly under
  background re-renders.
- `react-hooks/set-state-in-effect` violations are zero: the palette reset is done
  via derived state (`visibleResults`) and the dialog open/close is fully event-driven.
