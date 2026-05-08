# Implementation Plan — App-2 Stabilization + Learning Features

> Phase-2 deliverable. Mirrors the approved plan in `docs/adr/13-learning-mode-and-games.md`. This file documents the **executed** scope; deferred items are flagged.

## Overview

Phased RCA + remediation for canvas/node-editor regressions, plus architectural plan for Bible-mode palaces, room ordering/connections, room-scoped practice, Anki-style SR, journey/flashcard swipe, and a dedicated Games hub.

## Phases

P0 Schema + RCA fixes → P1 Hierarchy + Bible mode → P2 Practice scope + Games hub → P3 Journey/Flashcard UX (swipe, Anki-style) → P4 Mobile toolbars + node editor polish (deferred) → P5 Room duplicate + connections.

---

## Phase 0 — RCA fixes & schema groundwork ✅

**RCA — Canvas responsiveness**

- `RoomCanvas` container was `h-full w-full` and parent route used a fixed `h-[500px] md:h-[700px]`. `fitView` only fired once on mount when `initialNodes.length > 0`. No `ResizeObserver`; rotating the device or browser-chrome show/hide left the viewport stale.
- React Flow `<Controls/>` was `hidden md:flex`; mobile lost recenter affordance.
- iOS Safari URL-bar collapse changes height mid-drag; fixed-pixel containers stranded the canvas.

**Fixes**

- Route page now uses `h-[calc(100dvh-16rem)] min-h-[420px] w-full`.
- `RoomCanvas` wires a `ResizeObserver` over its container; debounces 120 ms; calls `instance.fitView({ padding: 0.2, duration: 200, maxZoom: 1.5 })`. An `isDraggingRef` skips the refit while a node drag is in progress (avoids snapping during user input). Flag toggled in `onNodeDragStart` / `onNodeDragStop` / `onSelectionDragStop`.
- Controls now visible on mobile (`flex md:flex`).

**RCA — Node Editor**

- `NodeEditorSheet` only edited `title`/`content`/`nodeType`/`color`/tags. Mobile sheet was `h-[80dvh]` (clipped by iOS keyboard). No verse-hint or reference fields.

**Fixes**

- Mobile sheet now `h-[100dvh]` with `pb-[env(safe-area-inset-bottom)]` and a `sticky bottom-0` action bar.
- New optional fields `verseHint` (≤2,000 chars) + `bibleRef` (≤120 chars) gated on `palaceMode === 'bible'`. Threaded as a prop from the route → `RoomCanvas` → `NodeEditorSheet`.

**Schema migration `0003_learning_mode.sql`** ✅

- `palace_mode` enum (`'bible' | 'simple'`); `palaces.mode` default `'bible'`.
- `rooms.prev_room_id` / `rooms.next_room_id` (nullable, self-FK ON DELETE SET NULL). Indexed.
- `nodes.verse_hint` (text, nullable, ≤2,000); `nodes.bible_ref` (text, nullable, ≤120).
- Idempotent DO blocks for enum + self-FKs. RLS unchanged — prev/next inherit existing room policy.

---

## Phase 1 — Hierarchy & Bible Mode ✅

- `EditPalaceDialog` extended with a Bible/Simple segmented control. Persists via existing `updatePalace` (no separate `setPalaceMode` action — single column update).
- Server-rendered route page reads palace and threads `mode` to `RoomCanvas` and (separately) to `RoomJourney`.
- `RoomJourney` Bible-mode UI: header reads "Chapter — {room title}"; card shows `Verse N` badge, `bibleRef` chip, tap-to-reveal verse hint.

---

## Phase 2 — Room-scoped practice + Games hub ✅

- `getDueNodes` already accepts an optional `roomId` filter (LEFT JOIN over `node_review_state` + lazy initialisation). No new action created — overloading was rejected as redundant.
- `/games` lists all modes (Daily review, Flashcards, Quiz) plus a per-palace quick-pick.
- `/palaces/[palaceId]/rooms/[roomId]/practice` reuses `PracticePicker` with a room-scoped `getDueNodes` call.

---

## Phase 3 — Anki-style flashcards + swipe gestures ✅ (partial)

**Swipe** — implemented via framer-motion `drag` API (already a dep; zero new libs).

- `useSwipeNavigation` (`apps/web/src/shared/hooks/useSwipeNavigation.ts`): `m.div drag` bindings, `dragConstraints={{ left:0, right:0, top:0, bottom:0 }}`, `dragElastic: 0.4`. `onDragEnd` measures `offset` + `velocity` against thresholds (`offset > 80 px || velocity > 500 px/s`) and routes to `onPrev/onNext/onSwipeUp/onSwipeDown` based on the **dominant axis**.
- Handlers pinned via `useRef` updated **inside `useEffect`** (not during render) to satisfy the `react-hooks/refs` rule.
- Reduced-motion users see no spring-back animation but swipe still functions (we honour `MotionConfig reducedMotion="user"` globally).

**Journey UI overhaul** ✅

- Replaced fade-only with key-driven horizontal slide (`initial={{ opacity:0, x: dir*32 }}`). `AnimatePresence mode="wait"` is **intentionally avoided** — incompatible with App Router (see ADR 12).
- Bible-mode chapter/verse labels + tap-to-reveal hint card.
- Footer hint: "Swipe or use ← → to navigate".

**FlashcardDeck (separate component) — DEFERRED.** The existing `QuizSession` already includes a flashcard mode and can absorb swipe in a follow-up; building a parallel deck would duplicate self-rating logic.

---

## Phase 4 — Mobile toolbars + node editor polish

**Implemented**: `NodeEditorSheet` 100dvh + safe-area + sticky save bar.

**Deferred**:

- `MobileActionToolbar` shared FAB component (palace/room list pages still rely on existing buttons).
- Per-field inline error toasts (validation already surfaces via the existing form pattern).

---

## Phase 5 — Room duplication + room connections

**Implemented**: `duplicateRoom` action (single transaction). Mirrors `duplicatePalace`:

1. Shift sibling positions `> source.position` by 1 in a single SQL UPDATE.
2. Insert duplicated room at `source.position + 1` with `(copy)` suffix.
3. Clone all nodes (re-mapped IDs); re-attach `node_tags` by name with `ON CONFLICT DO NOTHING`.
4. Copy **intra-room** edges only (cross-room edges skipped — user re-threads manually).
5. Skip review state and practice sessions (per ADR 9B convention — review history belongs to a node's own learning identity).

`prev_room_id` / `next_room_id` left null on the duplicate so the user manually re-threads the chapter sequence (avoids ambiguous insertion in the linked list).

**Deferred**: `setRoomOrder` action + `@dnd-kit/sortable` drag-reorder UI.

---

## Verification

1. **DB**: Drizzle `schema.ts` types updated; migration `0003_learning_mode.sql` is idempotent.
2. **Type/Lint**: `pnpm turbo typecheck` ✅, `pnpm turbo lint` ✅.
3. **Manual**: tested locally — canvas refits on resize, node sheet keeps action bar above home indicator, journey swipe advances cards.
4. **Guardrails**: no new cross-feature imports; `duplicateRoom` lives in `features/rooms`; practice routes do not import from `features/nodes`.

---

## Decisions

- **A** Linked-list `prev/next` is auxiliary to `position`, not replacement. Position is canonical sort.
- **B** Default `mode = 'bible'` for new palaces; existing palaces backfilled by the `DEFAULT` clause.
- **C** Swipe via framer-motion drag — zero new deps. `react-swipeable` / `@use-gesture/react` rejected.
- **D** `@dnd-kit/sortable` for room reorder — **deferred** to keep this batch lean.
- **E** `/practice` and `/games` coexist. `/games` is the new hub; `/practice` (the Daily Review queue) is linked from the hub as the "SR" mode.
- **F** Verse hint is plain-text only.

---

## Files

**New**

- `packages/db/migrations/0003_learning_mode.sql`
- `apps/web/src/app/(dashboard)/games/page.tsx`
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/practice/page.tsx`
- `apps/web/src/features/rooms/actions/duplicateRoom.ts`
- `apps/web/src/shared/hooks/useSwipeNavigation.ts`
- `docs/adr/13-learning-mode-and-games.md`

**Modified**

- `packages/db/src/schema.ts`, `types.ts`
- `apps/web/src/features/palaces/{schemas/palace.ts,actions/duplicatePalace.ts,components/EditPalaceDialog.tsx}`
- `apps/web/src/features/rooms/{index.ts,components/RoomJourney.tsx,actions/getRooms.ts}`
- `apps/web/src/features/nodes/schemas/node.ts`
- `apps/web/src/features/spatial-canvas/components/{RoomCanvas.tsx,NodeEditorSheet.tsx}`
- `apps/web/src/features/spatial-canvas/hooks/useRoomNodeMutations.ts`
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/{page.tsx,journey/page.tsx}`
