# ADR 14 — Flashcards, Mobile FAB, Duplicate Room, Room Reorder

**Status:** Accepted · **Date:** 2026-05 · **Builds on:** ADR 9A (practice/SR engine), ADR 13 (learning mode + games hub)

## Context

A targeted bug audit (recorded in `docs/plans/IMPLEMENTATION_PLAN_APP_2.md`) found that nine of twelve user-reported symptoms were already shipped on `main` — but three real defects and two adjacent issues remained:

1. **`/games` ships dead links.** The hub page links to `/games/flashcards` and `/games/quiz`, neither of which existed. Tapping either returned Next.js 404 from the dashboard's primary CTA.
2. **`duplicateRoom` had no UI surface.** The action was implemented and exported from `features/rooms/index.ts`; no button consumed it.
3. **No mobile FAB on list pages.** `CanvasFab` was canvas-coupled (depends on `useCanvasStore`, `useReactFlow`, `useRoomNodeMutations`); `/palaces` and `/palaces/[palaceId]` had no equivalent affordance on small screens.
4. **Room ordering was schema-only.** Migration `0003_learning_mode.sql` shipped `position` (canonical) plus auxiliary `prev_room_id`/`next_room_id` self-FKs, but no action wrote them and no UI changed them.
5. **Flashcards in `QuizSession` lacked Anki semantics.** Self-rating used opaque 1–5 numeric buttons; no swipe; no card flip.

## Root causes

### Why dead links shipped

`/games/page.tsx` was authored against a planned route layout. The hub renders three modes (Daily review, Flashcards, Quiz) — only Daily review (`/practice`) existed. The plan retrospective at `docs/plans/IMPLEMENTATION_PLAN_APP_2.md` previously claimed "/games lists all modes plus a per-palace quick-pick" without verifying the linked routes existed. The retrospective conflated **action shipped** with **feature shipped**; the same conflation hid the missing duplicate-room button.

### Why mobile FAB stayed canvas-only

`CanvasFab` was authored to expose canvas-specific state (snap toggle, recenter, add-node-at-center). Generalising it would have required pulling its UX out into a primitive without baking in `useCanvasStore`. That refactor was deferred and never picked up. The shared `MobileActionToolbar` belongs in `shared/components/` (cross-feature imports are forbidden) — it didn't exist.

### Why room reorder was incomplete

Schema columns are cheap to add but deceiving — they look like progress in `git log` without any consumer wiring. Adding `position` + linked-list pointers without an action or UI left orphaned columns. The plan document called this out but deferred it under "future work" without a tracking issue.

### Why flashcards lacked Anki semantics

`QuizSession` predates `useSwipeNavigation` (per the ADR 9A → ADR 13 timeline) and was never retrofitted. Mixing swipe gestures with the multi-mode `QuizSession` (multiple-choice + typed-recall + flashcard) would fire swipe handlers during typed input — incorrect. The fix is a dedicated `FlashcardDeck` on its own route.

## Decisions

### 1. Build `/games/flashcards` + `/games/quiz` as proper routes

`/games/flashcards` and `/games/quiz` are RSCs that read `?palaceId=…&roomId=…` from `searchParams`. With no scope, both render a picker (palace + per-palace room chips). With scope, flashcards pipes due nodes into a new `<FlashcardDeck>`; quiz pipes them into the existing `<QuizSession>` unchanged.

The hub copy and link layout are unchanged — the routes existed below them all along.

### 2. `FlashcardDeck` as a dedicated component, not a `QuizSession` mode

A separate component lets us:

- own the swipe gesture surface (no contamination of typed input);
- ship Anki labels (Again / Hard / Good / Easy) that map cleanly to SM-2 quality 0/3/4/5 via `recordPractice`;
- treat flip as the gating gesture — swipe before flip navigates the deck; swipe after flip submits a default rating ("right = good", "left = again");
- surface Bible-mode hints (`bibleRef` chip on prompt side, `verseHint` on answer side) when `palaceMode === 'bible'` without polluting `QuizSession`.

`getDueNodes` was extended to project `verseHint`, `bibleRef`, and `palaceMode` — additive change, no migration. `DueNodeWithMeta` got three new fields.

### 3. `DuplicateRoomButton` mirrors `DuplicatePalaceButton`

Same shape: `variant="ghost" size="sm"`, ghost icon, `toast.success(...)` + `router.refresh()` on success, `toast.error(...)` on failure. No new pattern. `RoomCard` footer is now `flex flex-wrap` so three buttons don't overflow on narrow viewports.

### 4. `MobileActionToolbar` as a shared primitive

Lives in `shared/components/`, not `features/`. Has no feature-specific imports — accepts a list of `{ label, Icon, onClick }`. A `MobileCreateFab` thin wrapper composes `useAppDialog().open(dialogId)` so list pages can drop a single line:

```tsx
<MobileCreateFab dialogId="create-palace" label="Create palace" />
```

Single-action mode is a shortcut: tap the FAB and it fires immediately, no menu. Multi-action mode preserves the radial-expand pattern from `CanvasFab`.

`bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]` clears the dashboard bottom nav (64 px) plus iOS home-indicator inset.

### 5. `setRoomOrder` writes `position` only

The action takes `{ palaceId, orderedIds }` and writes `position` via a single `CASE` expression. Validation rejects payloads that don't list every non-deleted sibling exactly once — partial coverage would silently introduce gaps in the canonical sort.

`prev_room_id`/`next_room_id` linked-list pointers stay null. They're auxiliary per `AGENTS.md`; chapter-traversal pointers would need their own ADR with a consumer in journey UI before we maintain them.

`RoomReorderControls` uses zero-dep `↑/↓` chevrons. `@dnd-kit/sortable` would deliver drag-and-drop but adds a new dep — deferred until users ask. Reorder controls only render when there are at least two rooms.

### 6. Process guardrail: feature complete = action AND UI

A barrel-exported server action without a render path is unfinished work, not shipped. This was the recurring failure mode behind bugs 2 (`duplicateRoom`), and 4 (room reorder columns). Captured as a one-line addition to `AGENTS.md` under "Critical patterns".

## Consequences

- `/games` no longer ships dead links. The hub is a working entry point.
- Duplicate room is one tap from `RoomCard`. The action's behaviour is unchanged from ADR 13 (single transaction, intra-room edges only, skips review state).
- Mobile users have a consistent primary-action affordance across `/palaces`, `/palaces/[id]`, and the canvas. The pattern is reusable on future list pages.
- Room order is editable. The `position` column is now the canonical user-visible sort and survives across reload.
- Flashcards have Anki ergonomics: tap/Space to flip, swipe or arrow keys to navigate, Again/Hard/Good/Easy to rate. Bible-mode flashcards surface verse references and hints.

## Trade-offs / known limits

- `RoomReorderControls` swaps with the immediate neighbour only — no jump-to-position. For palaces with 50+ rooms, drag-and-drop will be more ergonomic. Files for a follow-up ADR if the user reports it.
- Swipe-after-flip submitting a default rating is a UX choice (users who want fine-grained control still have buttons). The default ("right = good", "left = again") matches Anki's conservative semantics.
- The flashcards picker fetches one `getRooms` per palace listed. Acceptable up to ~20 palaces; if it becomes a bottleneck, switch to a single denormalised query.
- `MobileCreateFab` overlaps with the bottom nav at the right edge. Tested visually; if conflicts arise, the FAB's `bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]` is the knob to tune.

## Files

**New**

- `apps/web/src/features/practice/components/FlashcardDeck.tsx`
- `apps/web/src/app/(dashboard)/games/flashcards/page.tsx`
- `apps/web/src/app/(dashboard)/games/quiz/page.tsx`
- `apps/web/src/features/rooms/components/DuplicateRoomButton.tsx`
- `apps/web/src/features/rooms/components/RoomReorderControls.tsx`
- `apps/web/src/features/rooms/actions/setRoomOrder.ts`
- `apps/web/src/shared/components/MobileActionToolbar.tsx`
- `apps/web/src/shared/components/MobileCreateFab.tsx`

**Modified**

- `apps/web/src/features/practice/{actions/getDueNodes.ts,index.ts}` — verse fields + `palaceMode` projected into `DueNodeWithMeta`; `FlashcardDeck` exported.
- `apps/web/src/features/rooms/{components/RoomCard.tsx,index.ts}` — duplicate button wired; reorder slot added; barrels updated.
- `apps/web/src/app/(dashboard)/palaces/page.tsx` — mounts `MobileCreateFab`.
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/page.tsx` — mounts FAB and threads reorder controls.
- `AGENTS.md` — adds the "feature complete = action AND UI" guardrail line.
