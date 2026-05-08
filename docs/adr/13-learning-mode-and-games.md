# ADR 13 — Learning Mode, Games Hub, Swipe Navigation

**Status:** Accepted · **Date:** 2025-11 · **Builds on:** ADR 9A (practice/SR engine), ADR 9B (journey/stats/undo), ADR 12 (route-race stabilisation)

## Context

Two classes of regression and one feature gap surfaced together:

1. **Canvas / node-editor regressions** — fixed-pixel container heights stranded the canvas on iOS Safari URL-bar collapse; mobile lost the React Flow `<Controls/>` recenter affordance; the node-editor sheet (`h-[80dvh]`) clipped its action bar behind the iOS keyboard.
2. **Journey UX is fade-only** — no horizontal swipe, no chapter/verse semantics, no verse-hint reveal. Users couldn't drill a single room without going through the global Daily Review queue.
3. **No Bible-study primitives** — palaces had no concept of mode (Bible vs Simple), and nodes had no field for a "verse hint" or scripture reference.

## Root causes

### Canvas resize (regression in ADR 7 layout pass)

`RoomCanvas` was given `h-full w-full` but the parent route used `h-[500px] md:h-[700px]`. React Flow only auto-fits on mount. There was no `ResizeObserver` to refit when:

- the dynamic viewport changes (URL-bar collapse, on-screen keyboard),
- the device rotates,
- a sidebar toggles.

Once stranded, the only recovery was `CanvasFab → recenter`. Mobile users without the FAB hit a dead canvas.

### Node-editor sheet on iOS

`h-[80dvh]` reserved 20% of viewport for the underlay, but iOS Safari's URL bar still pushed the sticky action bar offscreen when the keyboard opened. Compounded by no `pb-[env(safe-area-inset-bottom)]`.

### Journey + practice scope

`RoomJourney` only consumed `(positionY, positionX)` ordering and rendered a single fade animation. There was no per-room practice route — only the global `/practice` queue from ADR 9A. `getDueNodes` already accepted an optional `roomId` filter (added speculatively in 9A), but no UI surface exercised it.

## Decisions

### 1. `100dvh`-based layout + `ResizeObserver`-driven `fitView`

- The room route now uses `h-[calc(100dvh-16rem)] min-h-[420px] w-full`. `100dvh` follows iOS Safari's dynamic viewport; `min-h` keeps the canvas usable on extreme split-screen.
- `RoomCanvas` wires a `ResizeObserver` over its container with a 120 ms debounce. On every settled size change it calls `instance.fitView({ padding: 0.2, duration: 200, maxZoom: 1.5 })`.
- An `isDraggingRef` is set true between `onNodeDragStart` and `onNodeDragStop` (and `onSelectionDragStop`). The resize observer skips refits while the user is dragging — otherwise the viewport snaps mid-drag and gestures feel hostile.
- `<Controls/>` is now visible at every breakpoint.

### 2. `palaces.mode` enum + Bible-mode UI gating

A new `palace_mode` enum (`'bible' | 'simple'`, default `'bible'`) drives presentational and field-level differences:

- Bible-mode UI labels rooms as "Chapters" and nodes as "Verse N", and surfaces optional `verseHint` (≤2,000 chars) + `bibleRef` (≤120 chars) fields in the node editor.
- Simple mode is the legacy behaviour. The toggle lives in `EditPalaceDialog`; persisted via the existing `updatePalace` action (no separate `setPalaceMode` — single-column update would be redundant).
- The mode is **threaded as a prop** from the route's RSC down through `RoomCanvas` and `RoomJourney`. No client-side query → no flicker, no stale render under React 19 strict mode.

### 3. Swipe via framer-motion (no new dep)

framer-motion was already in use for page transitions and node enter animations; its `drag` API gives us swipe for free.

`useSwipeNavigation` (`apps/web/src/shared/hooks/useSwipeNavigation.ts`) returns drag bindings for an `<m.div>`:

```ts
const swipe = useSwipeNavigation({ onPrev, onNext });
<m.div drag={swipe.drag} dragConstraints={swipe.dragConstraints} dragElastic={swipe.dragElastic} onDragEnd={swipe.onDragEnd} />
```

Thresholds: `|offset| > 80 px` OR `|velocity| > 500 px/s`, evaluated on the **dominant axis** to avoid ambiguous diagonals.

**React 19 / `react-hooks/refs` lint:** Handlers are pinned via `useRef` so the bindings object is referentially stable across renders (avoids restarting framer-motion's gesture listeners). The ref is updated **inside `useEffect`**, not during render — accessing `ref.current = …` during render is a violation under React 19 strict mode.

`react-swipeable` and `@use-gesture/react` were rejected — both are net-new deps that duplicate functionality already in `framer-motion`.

### 4. Linked-list room pointers as **auxiliary** to `position`

`rooms.prev_room_id` / `rooms.next_room_id` are nullable self-FKs (`ON DELETE SET NULL`). They're an optional convenience for chapter-traversal UI, not a replacement for `position`. The `position` column remains the canonical sort key. A future `setRoomOrder` action will keep both in sync atomically.

### 5. Reuse `getDueNodes`, don't fork

ADR 9A's `getDueNodes` already accepts an optional `roomId` filter via LEFT JOIN over `node_review_state`. Forking into `getRoomDueNodes` was rejected — same engine, same parameters, no behaviour change. The new room-scoped practice route just calls `getDueNodes({ roomId, limit: 100 })` and feeds the existing `PracticePicker`.

### 6. `duplicateRoom` mirrors `duplicatePalace` — copies intra-room edges, skips history

Single transaction:

1. Shift sibling positions `> source.position` by 1 in one SQL UPDATE.
2. Insert duplicate at `source.position + 1` with `(copy)` suffix.
3. Clone nodes (re-mapped IDs); re-attach `node_tags` by name with `ON CONFLICT DO NOTHING`.
4. Copy **intra-room** edges only — cross-room edges depend on graph identity that the user might want to redraw. Both endpoints must map to nodes inside the source room.
5. Skip review state + practice sessions — per ADR 9B convention, review history is a per-node learning identity that shouldn't be cloned.
6. Leave `prev_room_id` / `next_room_id` null on the duplicate so the user manually re-threads the chapter sequence.

## Consequences

- Canvas height now follows the dynamic viewport on every device. Refits are gentle (120 ms debounce, 200 ms animation) and never fight the user mid-drag.
- New palaces default to Bible mode; the toggle is non-destructive (Simple-mode users simply don't see the verse fields).
- Journey is now thumb-friendly on mobile (swipe + tap-to-reveal). Bible-mode users get verse semantics without any per-node scaffolding burden.
- Adding swipe to other surfaces (flashcards, quiz, palace cards) is now a one-import change.
- `duplicateRoom` enables curriculum-style workflows ("memorize Chapter 1 first, then duplicate as a template for Chapter 2").

## Trade-offs / known limits

- `<Controls/>` on mobile costs ~36 px of corner real-estate. We accepted this over a custom mini-control set.
- `useSwipeNavigation` doesn't support multi-touch pinch — out of scope; pinch-zoom on the canvas is React Flow's responsibility.
- Bible-mode and Simple-mode share the same node row. Migrating between modes is a no-op; verse fields persist on Simple-mode nodes (just hidden). This is intentional — round-tripping should be lossless.
- `duplicateRoom` is bounded by Postgres parameter limits on giant rooms. A chunked-insert variant is filed as a future ADR if anyone hits it.

## Anti-patterns to avoid

- **Never** use a fixed pixel height on a full-viewport canvas surface — `h-[500px]` will strand iOS users when the URL bar collapses.
- **Never** wire `ResizeObserver → fitView` without an `isDraggingRef` guard. Snapping during user input feels broken.
- **Never** assign `ref.current = …` during render. Update refs inside `useEffect` (or in event handlers) — React 19's `react-hooks/refs` will flag it and strict mode can fire it twice.
- **Never** introduce `react-swipeable` / `@use-gesture/react`. framer-motion `drag` is the canonical primitive.
- **Never** add `AnimatePresence mode="wait"` for App Router page transitions — `usePathname()` updates optimistically and exit/enter cycles fire against stale content (see ADR 12). Key-driven `m.div` with `initial`/`animate` is the safe pattern.

## References

- ADR 9A — practice/SR engine
- ADR 9B — journey, stats, undo
- ADR 12 — route-race stabilisation
- `useSwipeNavigation` — `apps/web/src/shared/hooks/useSwipeNavigation.ts`
- Migration — `packages/db/migrations/0003_learning_mode.sql`
