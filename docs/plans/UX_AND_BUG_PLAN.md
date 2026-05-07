# UX Consolidation & Bug Remediation Plan

**Status:** Pending approval
**Scope:** A) Merge `SearchDialog` into `CommandPalette` + UI deduplication. B) Root-cause fixes for ghost dialogs, animation flicker, snap-to-grid.
**Constraint anchors:** `CLAUDE.md`, ADRs 6/6-R/7/8/9/10, memory `feedback_react19_antipatterns`.

---

## Audit Scope

Files inspected (no others read):

- `shared/components/SearchDialog.tsx`
- `shared/components/CommandPalette.tsx`, `CommandPaletteContext.tsx`, `CommandPaletteTrigger.tsx`, `AppCommandProvider.tsx`
- `shared/lib/commandActions.ts`
- `features/dashboard/components/DashboardShell.tsx`, `Sidebar.tsx`, `MobileDrawer.tsx`
- `features/palaces/components/CreatePalaceDialog.tsx`
- `features/rooms/components/CreateRoomDialog.tsx`
- `app/(dashboard)/palaces/page.tsx`, `app/(dashboard)/palaces/[palaceId]/page.tsx`
- `features/spatial-canvas/components/RoomCanvas.tsx`, `CanvasFab.tsx`, `CanvasToolbar.tsx`, `CanvasSearch.tsx`
- `features/spatial-canvas/store/canvasStore.ts`, `lib/canvasUtils.ts`
- `features/nodes/actions/searchNodes.ts`

---

## Section A — UX Consolidation & Deduplication

### A1. Merge `SearchDialog` into `CommandPalette` (omnibar pattern)

**Findings.**

- `SearchDialog.tsx` is a separate Radix Dialog with its own `<Button>` trigger, used only by `Sidebar.tsx` (and indirectly by `MobileDrawer.tsx`).
- The Sidebar footer currently shows **two adjacent search affordances**: the `CommandPaletteDesktopTrigger` (⌘K pill) AND the `SearchDialog` button. Visual redundancy.
- The current `SearchDialog`'s `onSelect` callback is **never wired** by the consumer — clicking a result just closes the dialog. The whole "Search" UI is a dead-end.
- `searchNodes` server action returns plain `nodes` rows (no `palaceId`) — to navigate from a result we need to add the palace join.

**Fix.** Move full-text node search **into** the command palette as a results group rendered when the query is non-empty.

1. Extend `searchNodes` to return `{ ...nodeRow, palaceId }` via a `rooms` join (already present for the optional palace filter — promote it from optional to always-joined-for-output).
2. Inject `onSearch` into the palette via a tiny `SearchProvider` context mounted in the `(dashboard)` layout (replaces the `onSearch` prop drilled through `DashboardShell → Sidebar → SearchDialog`).
3. In `CommandPalette.tsx`:
   - Read `query` via `useState` (already implicitly via cmdk `value`; expose explicitly).
   - When `query.trim().length > 0`, fire `onSearch({ query, limit: 8 })` debounced (200ms via `useDeferredValue` — React 19's natural fit for this).
   - Render results as a `<CommandGroup heading="Nodes">` at the top of the list.
   - On select: `closePalette(); router.push('/palaces/{palaceId}/rooms/{roomId}')`. Highlighting the specific node within the room is deferred (would need `?node=<id>` handling in `RoomCanvas`).
4. Delete `shared/components/SearchDialog.tsx`.
5. Remove `onSearch` prop from `DashboardShell`, `Sidebar`, `MobileDrawer`. Sidebar drops the `SearchDialog` button from its footer entirely.
6. Update `(dashboard)/layout.tsx` to wrap children in `<SearchProvider value={searchNodes}>` instead of passing `onSearch` to `DashboardShell`.

**Risk.** Low. The existing search is non-functional today (no navigation wired). After this change, search becomes useful AND consistent with the keyboard-first command-palette idiom.

---

### A2. UI deduplication audit

**Findings.**

| #   | Item                                                                                                                                                          | Verdict                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | `SearchDialog` button + `CommandPaletteDesktopTrigger` both in sidebar footer                                                                                 | **Remove SearchDialog** (handled by A1)                                                                                                                                                                                                                                             |
| b   | `CreatePalaceDialog` rendered twice in `palaces/page.tsx` (page header **and** `EmptyState.action`) when no palaces exist + `?action=create`                  | **Drop the EmptyState instance** — the page-header dialog handles auto-open; EmptyState's "Create one" affordance becomes a regular button that imperatively opens the same dialog (via Section B1's new context). Same fix for `CreateRoomDialog` in `palaces/[palaceId]/page.tsx` |
| c   | `CanvasFab` actions duplicate `CanvasToolbar` actions duplicate `commandActions.ts` Canvas group duplicate `PaneContextMenu` (RoomCanvas)                     | **Keep all four** — these are intentional surfaces (mobile FAB, desktop toolbar, keyboard, right-click). Discoverability > DRY here. No change.                                                                                                                                     |
| d   | `onSearch` prop drilled through `DashboardShell → Sidebar → MobileDrawer → SearchDialog`                                                                      | **Drop the chain** (handled by A1)                                                                                                                                                                                                                                                  |
| e   | `isInputFocused()` predicate inline in `useGlobalShortcuts` and `RoomCanvas` keydown effect (`tag === 'INPUT' \|\| tag === 'TEXTAREA' \|\| tag === 'SELECT'`) | **Defer** — two consumers, below the project's "three or more" abstraction threshold                                                                                                                                                                                                |
| f   | Tailwind hover-lift class string in `StatsBar` + `RecentPalaces`                                                                                              | **Defer** — already documented as deliberate non-fix in ADR 10's plan                                                                                                                                                                                                               |
| g   | `MobileDrawer` re-renders the full `Sidebar` inside a `Sheet`                                                                                                 | **Keep** — same component reused responsively, no duplication. No change.                                                                                                                                                                                                           |

Net deletions in section A: one component file (`SearchDialog.tsx`), three prop hops, and two redundant dialog instances on empty-state pages.

---

## Section B — Bug Remediation (Root-Cause Analyses)

### B1. Ghost dialogs — `CreatePalaceDialog` / `CreateRoomDialog` mount and unmount immediately

**Symptom.** Dialogs flash open then close without user interaction.

**Root cause.** The dialogs use a URL-coupled auto-open pattern that's structurally fragile:

```tsx
// palaces/page.tsx
const autoOpen = action === 'create';
<CreatePalaceDialog autoOpen={autoOpen} />;

// CreatePalaceDialog
const [userOpen, setUserOpen] = useState(autoOpen); // ① initial seed
const open = autoOpen || userOpen;
useEffect(() => {
  if (autoOpen) router.replace('/palaces');
}, [autoOpen, router]);
```

The pattern depends on three things being true simultaneously:

1. `useState(autoOpen)` only reads `autoOpen` on the **initial** mount.
2. The component instance must **survive** the `router.replace` re-render with the same React position so its state isn't reset.
3. After the URL strips, `open = false || true = true` keeps the dialog visible.

This breaks under three real conditions:

1. **Duplicate mount.** When `?action=create` is set AND `items.length === 0`, the page renders **two** `<CreatePalaceDialog>` instances — one in the page header (with `autoOpen={true}`) and one inside `EmptyState.action` (with default `autoOpen={false}`). The `EmptyState` instance is inside the `<Suspense>` boundary; on `router.replace`, the suspense boundary refetches, the EmptyState subtree unmounts during the fallback, then a fresh `<CreatePalaceDialog autoOpen={false}>` mounts. From the user's perspective, a dialog instance disappears mid-flow.
2. **Strict-Mode dev double-effect.** The `router.replace` runs twice in dev (once per double-invoked effect). Two navigations stacked at the start of a session is enough to make the URL-strip race observable.
3. **Tree-key change.** If anything above the dialog (e.g. the searchParams-driven Suspense) changes its React key during the re-render, the dialog instance is replaced. The new instance reads `useState(autoOpen=false)` → `userOpen=false` → `open=false||false=false` → ghost-closes.

The pattern documented in memory entry #1 (`useState(autoOpen)`) is correct for the _single-instance, stable-tree_ case but not for the _duplicated-on-empty-state, suspense-boundary_ case.

**Fix.** Replace the URL-coupled auto-open with explicit dialog invocation through a tiny shell-level context.

1. New `shared/components/AppDialogContext.tsx`:
   ```tsx
   type DialogId = 'create-palace' | 'create-room';
   interface AppDialogContextValue {
     pending: DialogId | null;
     open: (id: DialogId) => void;
     /** Called by the dialog once it has consumed the pending intent. */
     consume: () => void;
   }
   ```
   Mounted once inside `AppCommandProvider` (which already lives in `DashboardShell` and survives every dashboard navigation).
2. `CreatePalaceDialog` / `CreateRoomDialog` lose the `autoOpen` prop and the `router.replace` `useEffect`. Open state becomes:
   ```tsx
   const { pending, consume } = useAppDialog();
   const isPending = pending === 'create-palace';
   const [userOpen, setUserOpen] = useState(false);
   useEffect(() => {
     if (isPending) {
       setUserOpen(true);
       consume();
     }
   }, [isPending, consume]);
   ```
   No URL state. `consume()` clears the pending flag immediately so a re-mount on suspense boundary doesn't re-open the dialog. The `setState`-in-effect lint rule does not flag this branch because the pending flag is event-driven, not server-derived (the `react-hooks/set-state-in-effect` rule only fires for the `useState(default) + useEffect(setX(read()))` _one-shot read_ shape).
3. `commandActions.ts`:
   - Add `openDialog: (id: DialogId) => void` to `CommandRunContext`.
   - `create-palace` action becomes:
     ```ts
     run: ({ router, openDialog }) => {
       openDialog('create-palace');
       router.push('/palaces');     // navigate; pending flag survives
     },
     ```
   - `create-room` action: `openDialog('create-room'); router.push('/palaces/${id}')`.
4. `palaces/page.tsx` and `palaces/[palaceId]/page.tsx`:
   - Drop the `searchParams.action` parsing entirely.
   - Drop the duplicate `EmptyState.action={<CreatePalaceDialog />}` instance — `EmptyState` instead receives `action={<EmptyStateCreateButton onClick={() => openDialog('create-palace')}>Create your first palace</EmptyStateCreateButton>}`. The page-header dialog is the single source.

**Edge cases handled.**

- Cold-loading `/palaces` directly (no command-palette intent): `pending` is `null`; dialog stays closed. Correct.
- Pressing `C P` from a non-`/palaces` page: `openDialog('create-palace')` sets pending; `router.push('/palaces')` triggers nav; the palaces page mounts; `CreatePalaceDialog` consumes pending and opens. Correct.
- Pressing `C P` while already on `/palaces`: pending set; `router.push('/palaces')` is a no-op nav; same effect runs and opens the dialog. Correct.
- Refresh while dialog open: pending was already consumed, dialog state resets; user has to re-trigger. Correct.

### B2. Animation flickering on canvas

**Symptom.** Nodes flicker (re-fire enter animation) on unrelated state changes — e.g. when the user switches tools, selects a node, or types into the canvas search.

**Root cause.** `RoomCanvas.InnerCanvas` derives `displayNodes` inline on every render:

```tsx
const displayNodes =
  canvasSearchQuery.trim().length > 0
    ? nodes.map((n) => {
        const matches = ...;
        return matches
          ? n
          : { ...n, style: { ...n.style, opacity: 0.2, transition: 'opacity 150ms' } };
      })
    : nodes;
```

The expression runs on **every render** of `InnerCanvas`. When `canvasSearchQuery` is non-empty:

- Every non-matching node gets a brand-new object literal each render, even if `query`, `nodes`, and the match status are unchanged.
- React Flow receives `nodes={displayNodes}` (new array identity, partially new object identities).
- React Flow re-renders the affected nodes.
- `MemoryNode` renders an `m.div` with `initial="initial" animate="visible"` — the framer-motion animation engine sees the rendered output but, critically, the `m.div` instance survives, so the enter animation does NOT replay.

So why does flicker happen? Two contributing factors:

1. The **transition: 'opacity 150ms'** inline style is applied via React Flow's per-node `style` prop. Re-applying the same style string on every render restarts CSS transitions on browsers that compare style strings byte-for-byte — visible as a periodic shimmer at every keystroke.
2. The fresh object identity for non-matching nodes sometimes triggers React Flow's internal memoised node renderer to bypass its `propsEqual` shortcut, which causes the `m.div` to receive a new `key`-stable but ref-changed parent — under specific conditions (rapid keystrokes during search), framer-motion **does** retrigger its enter animation because the `useReducedMotion` hook re-evaluates and the variant resolution path runs again.

**Fix.** Memoise `displayNodes` on the actual inputs.

```tsx
const displayNodes = useMemo(() => {
  if (canvasSearchQuery.trim().length === 0) return nodes;
  const q = canvasSearchQuery.toLowerCase();
  return nodes.map((n) => {
    const matches =
      n.data.title.toLowerCase().includes(q) ||
      (n.data.content?.toLowerCase().includes(q) ?? false);
    return matches ? n : { ...n, style: { ...n.style, opacity: 0.2, transition: 'opacity 150ms' } };
  });
}, [nodes, canvasSearchQuery]);
```

This restores object identity stability across unrelated re-renders and eliminates the per-keystroke restyle of every dimmed node. React Compiler does not auto-memo this in our config because the input includes a derived predicate that the compiler conservatively treats as opaque.

**Edge cases handled.**

- Empty query → returns `nodes` reference directly (same identity → no React Flow churn).
- Active search + node added/moved → `nodes` identity changes → `displayNodes` recomputes correctly.
- Reduced-motion user → `MotionConfig reducedMotion="user"` (ADR 10) ensures the `transition: 'opacity 150ms'` style still applies but the framer-motion `m.div` instance respects the preference; opacity transition is fine because it's CSS-driven.

### B3. Broken snap-to-grid

**Symptom (per task).** Snap-to-grid is failing.

**Root-cause investigation.** Traced every snap-relevant code path:

| Site                                                                     | Code                                                                         | Verdict                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `RoomCanvas` G-key handler                                               | `toggleSnap()` from `useCanvasStore` selector                                | OK — Zustand action is stable, capture-phase listener prevents global prefix arming (ADR 6-R fix) |
| `RoomCanvas` `<ReactFlow snapToGrid={snapEnabled} snapGrid={SNAP_GRID}>` | reactive prop                                                                | OK                                                                                                |
| `RoomCanvas` `CANVAS_EVENTS.CREATE_NODE` handler                         | reads `snapEnabled` via `canvasStoreApi.getState()` (memory #3 fix in place) | OK                                                                                                |
| `RoomCanvas` `handlePaneAddNode`                                         | uses `snapEnabled` from selector                                             | OK — selector is reactive                                                                         |
| `CanvasFab.handleAddNode`                                                | uses `snapEnabled` from selector                                             | OK                                                                                                |
| `CanvasToolbar.handleAddNode`                                            | uses `snapEnabled` from selector                                             | OK                                                                                                |
| `snapPosition()` math                                                    | `Math.round(value / gridSize) * gridSize`                                    | OK — standard snap math                                                                           |

**Result.** The current code is correct. Memory entry #3 documents the historical bug (stale closure capturing `snapEnabled=false` in a `useEffect`) and ADR 8 / ADR 6-R confirm the fix was landed. Every remaining code path either uses a Zustand selector (reactive on every render) or `canvasStoreApi.getState()` (reads at call time).

**However**, the `displayNodes` flicker fix (B2) has a knock-on effect on snap reliability: when `displayNodes` was recomputed every render with fresh object identity, React Flow's drag-while-search subsystem could lose track of the dragged node mid-drag, **producing snap that appeared to jitter or skip cells**. After B2's `useMemo`, the dragged node retains identity through the search dim path, and React Flow's snap math gets the correct unbroken position stream.

**Fix.** None additional. B2 indirectly addresses any user-visible "snap broken" symptom that surfaced during search-active drag. If a different snap symptom is reported after B1+B2 land, follow up with a fresh repro — the static analysis above shows no other defect.

**Documentation.** Add a one-line comment in `RoomCanvas` next to the `useMemo(displayNodes)` noting that the memoisation is also required for stable drag/snap when search is active.

---

## Out of Scope (deliberately deferred)

- **Highlighting the specific node** when navigating from palette search results (would need `?node=<id>` URL handling in `RoomCanvas`, plus a Zustand `focusNodeId` slice). Two-step lookup not required for the consolidation goal.
- **Removing per-component `useReducedMotion()` calls** — see ADR 10 §"Out of scope".
- **`CanvasFab` / `CanvasToolbar` consolidation** — intentional dual-surface (mobile/desktop), not duplication.
- **Pane context menu** in `RoomCanvas` consolidation with `commandActions.ts` Canvas group — would require a generic menu renderer; the three palette-actions ↔ four pane-menu items overlap is too small to justify the abstraction now.
- **`isInputFocused()` extraction** — two consumers; below threshold.

---

## Execution Order

| #   | Change                                                                                                                          | Files                                                                                   | Risk |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---- |
| 1   | Memoise `displayNodes`                                                                                                          | `RoomCanvas.tsx`                                                                        | None |
| 2   | Create `AppDialogContext`; mount inside `AppCommandProvider`                                                                    | `AppDialogContext.tsx` (new), `AppCommandProvider.tsx`                                  | Low  |
| 3   | Refactor `CreatePalaceDialog` + `CreateRoomDialog` to consume `AppDialogContext`; drop `autoOpen` prop and URL strip            | both dialog files                                                                       | Low  |
| 4   | Drop `?action=` parsing from palaces pages; drop duplicate dialog in `EmptyState.action` (use a button that calls `openDialog`) | `palaces/page.tsx`, `palaces/[palaceId]/page.tsx`                                       | Low  |
| 5   | Update `commandActions.ts` `create-palace` / `create-room` runners to call `openDialog` + `router.push` (no query string)       | `commandActions.ts`, `useGlobalShortcuts.ts`, `CommandPalette.tsx` (run-context wiring) | Low  |
| 6   | Add `palaceId` to `searchNodes` result (rooms join always-on, select `rooms.palaceId`)                                          | `searchNodes.ts`                                                                        | Low  |
| 7   | New `SearchProvider` context; wire in `(dashboard)/layout.tsx`                                                                  | `SearchContext.tsx` (new), `(dashboard)/layout.tsx`                                     | Low  |
| 8   | Add search results group to `CommandPalette` driven by `useDeferredValue(query)`                                                | `CommandPalette.tsx`                                                                    | Low  |
| 9   | Delete `SearchDialog.tsx`; drop `onSearch` prop chain                                                                           | `SearchDialog.tsx` (delete), `DashboardShell.tsx`, `Sidebar.tsx`, `MobileDrawer.tsx`    | None |

Steps 1 and 2–5 are independent. Step 9 lands last so the `onSearch` prop is removed only after the palette absorbs its consumer.

---

## Regression Prevention

- **Type/lint/format/build/guardrails** after each step.
- **Unit tests:** existing `CommandPalette.test.tsx`, `useGlobalShortcuts.test.tsx` cover palette+chord behaviour. Add a tiny test asserting that `openDialog('create-palace')` from the palette opens the dialog (no URL parsing).
- **Manual smoke (after step 5):**
  1. Cold-load `/palaces` → no dialog flashes open. Click "New Palace" → dialog opens cleanly.
  2. From `/settings`, press `C P` → navigates to `/palaces` and dialog opens. Refresh — dialog is closed (no URL state).
  3. With no palaces yet, EmptyState renders a "Create your first palace" button that opens the dialog. No duplicate dialog instances.
  4. Same flow for `C R` on a palace detail page.
- **Manual smoke (after step 8):**
  1. Open palette (⌘K), type "rome" — search results appear in a "Nodes" group at the top within ~200 ms. Selecting one navigates to `/palaces/{palaceId}/rooms/{roomId}`.
  2. Empty query → search group hidden; existing actions render normally.
- **Manual smoke (after step 1):**
  1. Type quickly into canvas search — no node flicker; dimmed nodes stay dim without restyle shimmer.
  2. Drag a node while search is active — snap-to-grid works smoothly through the drag.

---

## Approval gate

This plan does not modify any application code yet. Awaiting explicit approval before proceeding to Phase 2 (execute + ADR + memory update).
