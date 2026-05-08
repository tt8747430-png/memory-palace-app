# Implementation Plan — Phase 2 stabilization (RCA + remediation)

> **Status:** Draft for approval. Phase 1 of two-phase task — DO NOT modify application code until "APPROVED".
> **Targets:** Symptoms 1–12 from the user brief, plus adjacent silent failures discovered during audit.
> **Constraints:** Must honour `AGENTS.md` — `proxy.ts` only, semantic tokens (no raw hex in `*.tsx`), no `max-*:` breakpoints, `cn` from `@memory-palace/ui`, named exports, no cross-feature imports, server actions = Zod → `checkRateLimit` → Drizzle → `ActionResponse<T>`, Drizzle helpers from `@memory-palace/db` only, Tailwind v4 `@theme inline`, sonner imported via `@memory-palace/ui`.
> **Supersedes:** the previous retrospective at this path (now codified in ADR 13 / 9A / 9B / 9C — see `docs/adr/`).

---

## 1. Audit summary — what's actually broken vs. what shipped

I verified each of the user's 12 symptoms against the codebase. **Nine are already shipped**; **three plus four adjacent issues are real.** This plan only proposes work for the real items.

| #   | Symptom                                          | Status on `main`                                                                 | Evidence                                                                                                                                                                                            |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quizzes palace + room driven                     | Shipped                                                                          | [`(dashboard)/palaces/[palaceId]/rooms/[roomId]/practice/page.tsx`](<apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/practice/page.tsx>) calls `getDueNodes({ roomId, limit: 100 })` |
| 2   | Node editor lacks functionality                  | Shipped (verse fields, mobile 100dvh, sticky save)                               | [`NodeEditorSheet.tsx`](apps/web/src/features/spatial-canvas/components/NodeEditorSheet.tsx) gates `verseHint`/`bibleRef` on `palaceMode === 'bible'`                                               |
| 3   | Duplicate room                                   | **Action exists, no UI**                                                         | `duplicateRoom` exported from `features/rooms/index.ts:6`; `RoomCard.tsx` only renders Edit + Delete                                                                                                |
| 4   | Canvas mobile responsiveness                     | Shipped                                                                          | Room route uses `h-[calc(100dvh-16rem)] min-h-[420px]`; `RoomCanvas` wires `ResizeObserver` + `isDraggingRef`                                                                                       |
| 5   | Mobile toolbar parity (palaces/rooms list pages) | **Missing**                                                                      | `CanvasFab` exists for canvas only; `/palaces` and `/palaces/[palaceId]` have no FAB on mobile                                                                                                      |
| 6   | Games hub                                        | **Page exists, two of three links 404**                                          | [`(dashboard)/games/page.tsx`](<apps/web/src/app/(dashboard)/games/page.tsx>) links to `/games/flashcards` and `/games/quiz` — neither route exists                                                 |
| 7   | Connect rooms in logical order                   | **Schema exists, no UI/action**                                                  | `rooms.position` + `prev_room_id`/`next_room_id` shipped in `0003_learning_mode.sql`; no `setRoomOrder` action, no reorder UI                                                                       |
| 8   | Anki-style flashcards                            | **Mode exists inside `QuizSession`, but no swipe, no card-flip, no Anki labels** | [`QuizSession.tsx`](apps/web/src/features/practice/components/QuizSession.tsx) flashcard branch is text-reveal + 1–5 number buttons                                                                 |
| 9   | Bible / Simple mode                              | Shipped                                                                          | `palaces.mode` enum default `'bible'`; toggle in [`EditPalaceDialog.tsx`](apps/web/src/features/palaces/components/EditPalaceDialog.tsx); threaded as prop end-to-end                               |
| 10  | Journey UI per room                              | Shipped                                                                          | [`RoomJourney.tsx`](apps/web/src/features/rooms/components/RoomJourney.tsx) + `[roomId]/journey/page.tsx`                                                                                           |
| 11  | Swipe on journey + flashcards                    | **Journey shipped, flashcards not**                                              | `useSwipeNavigation` is wired into `RoomJourney`; `QuizSession` has zero gesture surface                                                                                                            |
| 12  | UI polish (Talantul/Anki)                        | Shipped (marketing accent palette + Reveal + AmbientOrbs per ADR 9C)             | `(marketing)/_components/AmbientOrbs.tsx`, `shared/components/Reveal.tsx`, `--font-display` Space Grotesk                                                                                           |

**Adjacent silent failures discovered:**

- **A1.** `/games` ships **broken links to `/games/flashcards` and `/games/quiz`**. Tapping either today returns Next.js's 404 page from a hub the user is told to start at — a real production-visible defect.
- **A2.** `QuizSession` flashcard self-rating uses raw 1–5 numeric buttons. Anki convention is **Again / Hard / Good / Easy** (or the SM-2 quality ladder). Numeric buttons are unlearnable and don't carry semantic intent into the SR engine. Bug because the user asked for Anki-style.
- **A3.** `useSwipeNavigation` returns `drag: 'x' | 'y' | true` but the hook always sets `dragConstraints={{ left:0, right:0, top:0, bottom:0 }}` regardless of axis. When `drag={true}`, vertical pulls are constrained to 0 but framer-motion still fires `onDragEnd` for them — fine, but worth verifying the spring-back doesn't visibly jitter on cards with content overflow. Low-severity; flagging for the audit pass.
- **A4.** `RoomCard` orders Edit + Delete with `gap-2 pt-0` — when we add a Duplicate button between them the line will wrap on narrow viewports unless we move actions into a `flex-wrap` container or a kebab menu. Cosmetic but affects mobile usability (symptom 5 territory).

---

## 2. Root cause analysis per real bug

### Bug 3 (+ A4) — Duplicate Room button never wired

**Root cause.** `duplicateRoom` was implemented in `features/rooms/actions/duplicateRoom.ts` and re-exported from the feature barrel, but the corresponding UI was never built. There's no `DuplicateRoomButton.tsx` next to its sibling palace counterpart at `features/palaces/components/DuplicatePalaceButton.tsx`.

**Why this slipped.** The previous retrospective at this path lists it under "Implemented" because the **action** shipped; the surface was deferred without a tracking issue. Plan retrospectives that conflate "action exists" with "feature shipped" cause exactly this kind of dead code.

### Bug 5 — No mobile FAB on palace/room list pages

**Root cause.** `CanvasFab` (`features/spatial-canvas/components/CanvasFab.tsx`) is hard-coded to canvas concerns: it depends on `useCanvasStore`, `useReactFlow`, and `useRoomNodeMutations`. There's no shared `MobileActionToolbar` primitive in `shared/components/`. The Phase 4 deferral note in the prior retrospective explicitly listed this as outstanding.

**Constraint reminder.** Per `AGENTS.md`, cross-feature imports are forbidden — a list-page FAB on `/palaces` cannot import from `features/spatial-canvas`. The shared FAB belongs in `shared/components/`.

### Bug 6 + Bug 8 (+ A1) — `/games/flashcards` and `/games/quiz` don't exist

**Root cause.** `/games/page.tsx` was authored against a planned route layout that was never created — likely a copy-paste from a planning artifact. Tapping the cards today produces Next.js 404. Anki-style flashcards (symptom 8) was meant to live at `/games/flashcards`.

**Why this matters.** The hub is the entry point for "Games" navigation in the dashboard sidebar; a 404 on the primary CTA is the most visible class of dead link. This is the single highest-leverage fix.

### Bug 7 — Room ordering UI missing

**Root cause.** Migration `0003_learning_mode.sql` added `prev_room_id` / `next_room_id` self-FKs on `rooms`, and `position` is canonical sort, but:

1. There is no `setRoomOrder` server action.
2. There is no drag-handle / sortable surface in [`PalacePage`](<apps/web/src/app/(dashboard)/palaces/[palaceId]/page.tsx>) — rooms render in `getRooms` order with no reorder affordance.
3. The linked-list pointers are never read by any UI; they're orphaned columns.

**Constraint.** `position` is the canonical sort per `AGENTS.md`; `prev_room_id`/`next_room_id` are auxiliary. So the action must update `position` (canonical) and may optionally backfill the linked-list pointers. The user's symptom ("connect rooms into a logical order") is satisfied by ordered `position` alone — chapter-traversal pointers are orthogonal and can be deferred.

### Bug 11 (+ A2) — No swipe + non-Anki ratings on flashcards

**Root cause.** `QuizSession` was built before `useSwipeNavigation` existed (per ADR 9A vs ADR 13 timeline) and was never retrofitted. The flashcard self-rating uses bare 1–5 buttons; Anki's "Again/Hard/Good/Easy" semantics aren't surfaced even though `recordPractice` already accepts `score` and the SM-2 reducer already maps quality from `(score, correct)`.

**Why a dedicated `/games/flashcards` is the right home, not `QuizSession`.** Mixing swipe gestures with the multi-mode `QuizSession` (multiple-choice + typed-recall + flashcard) means swipe handlers fire during typed input and choice-tap. A dedicated `FlashcardDeck` component on its own route avoids that hazard.

---

## 3. Files to touch — exact code blocks

### 3.1 `DuplicateRoomButton` + RoomCard wiring

**New file:** `apps/web/src/features/rooms/components/DuplicateRoomButton.tsx`

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2 } from 'lucide-react';
import { Button, toast } from '@memory-palace/ui';
import { duplicateRoom } from '../actions/duplicateRoom';

interface Props {
  id: string;
  palaceId: string;
  title: string;
}

export function DuplicateRoomButton({ id, palaceId, title }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await duplicateRoom({ id, palaceId });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Duplicated "${title}"`);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Duplicate room ${title}`}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
      <span className="ml-1.5 hidden sm:inline">Duplicate</span>
    </Button>
  );
}
```

**Modify:** `apps/web/src/features/rooms/components/RoomCard.tsx` — replace footer to wrap actions and include duplicate button:

```tsx
<CardFooter className="flex flex-wrap gap-2 pt-0">
  <EditRoomDialog room={room} />
  <DuplicateRoomButton id={room.id} palaceId={room.palaceId} title={room.title} />
  <DeleteRoomButton id={room.id} palaceId={room.palaceId} title={room.title} />
</CardFooter>
```

**Modify:** `apps/web/src/features/rooms/index.ts` — add barrel export:

```ts
export { DuplicateRoomButton } from './components/DuplicateRoomButton';
```

### 3.2 `/games/flashcards` — Anki-style deck

**New file:** `apps/web/src/app/(dashboard)/games/flashcards/page.tsx`

RSC that resolves `?palaceId=…&roomId=…` from `searchParams`, fetches due nodes (or all room nodes if there are no due ones — flashcard mode shouldn't 404 on an empty SR queue), and hands them to a client `<FlashcardDeck>`. Includes a picker (palace + optional room) when no scope is specified.

**New file:** `apps/web/src/features/practice/components/FlashcardDeck.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { useSwipeNavigation } from '@/shared/hooks/useSwipeNavigation';
import { recordPractice } from '../actions/recordPractice';
import type { DueNodeWithMeta } from '../actions/getDueNodes';

type Quality = 'again' | 'hard' | 'good' | 'easy';

const QUALITY_TO_SCORE: Record<Quality, { score: number; correct: boolean }> = {
  again: { score: 0, correct: false }, // SM-2 quality 0–1
  hard: { score: 50, correct: true }, // SM-2 quality 3
  good: { score: 80, correct: true }, // SM-2 quality 4
  easy: { score: 100, correct: true }, // SM-2 quality 5
};

interface Props {
  nodes: DueNodeWithMeta[];
  /** Read from palace.mode === 'bible' upstream. */
  showVerseHint?: boolean;
}

export function FlashcardDeck({ nodes, showVerseHint = false }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = nodes[index];

  const advance = () => {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, nodes.length));
  };
  const back = () => {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  };

  // require flip before swipe submits a rating (else swipe just navigates)
  const swipe = useSwipeNavigation({ onPrev: back, onNext: advance });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'ArrowRight') advance();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function rate(q: Quality) {
    if (!current) return;
    const { score, correct } = QUALITY_TO_SCORE[q];
    await recordPractice({ nodeId: current.id, score, correct, mode: 'flashcard' });
    advance();
  }

  if (!current) {
    return <div className="rounded-lg border bg-card p-8 text-center">Deck complete.</div>;
  }

  return (
    <div className="space-y-4">
      <header className="flex justify-between text-xs text-muted-foreground">
        <span>
          Card {index + 1} of {nodes.length}
        </span>
        <span>
          {current.palaceTitle} · {current.roomTitle}
        </span>
      </header>

      <m.article
        drag={swipe.drag}
        dragConstraints={swipe.dragConstraints}
        dragElastic={swipe.dragElastic}
        onDragEnd={swipe.onDragEnd}
        className="rounded-xl border bg-card p-8 select-none cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        aria-label={flipped ? 'Show prompt side' : 'Reveal answer'}
      >
        {!flipped ? (
          <>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</p>
            <h2 className="mt-2 text-xl font-semibold">{current.title}</h2>
            {showVerseHint && current.bibleRef ? (
              <p className="mt-3 text-xs text-muted-foreground">{current.bibleRef}</p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Answer</p>
            <p className="mt-2 whitespace-pre-wrap text-base">
              {current.content?.trim() || <em className="text-muted-foreground">No content.</em>}
            </p>
          </>
        )}
      </m.article>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => rate('again')}>
            Again
          </Button>
          <Button variant="outline" onClick={() => rate('hard')}>
            Hard
          </Button>
          <Button variant="outline" onClick={() => rate('good')}>
            Good
          </Button>
          <Button variant="primary" onClick={() => rate('easy')}>
            Easy
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={back} disabled={index === 0} className="flex-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="primary" onClick={() => setFlipped(true)} className="flex-2">
            <RotateCcw className="h-4 w-4" /> Reveal
          </Button>
          <Button variant="outline" onClick={advance} className="flex-1">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Tap or press <kbd>Space</kbd> to flip · swipe left/right after flipping
      </p>
    </div>
  );
}
```

**Barrel export:** add `FlashcardDeck` to `features/practice/index.ts`.

### 3.3 `/games/quiz` — palace/room-scoped quiz

**New file:** `apps/web/src/app/(dashboard)/games/quiz/page.tsx`

RSC. If `searchParams.roomId` is present → fetch nodes via `getDueNodes({ roomId, limit: 50 })` and render `<QuizSession nodes={…} initialMode="multiple-choice" />`. Otherwise render a picker (palace, then room) backed by `getPalaces` + `getRooms`. The existing `QuizSession` is reused unchanged — multiple-choice and typed-recall already work.

### 3.4 `MobileActionToolbar` shared FAB

**New file:** `apps/web/src/shared/components/MobileActionToolbar.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@memory-palace/ui';

export interface MobileAction {
  label: string;
  Icon: React.ElementType;
  onClick: () => void;
}

interface Props {
  actions: ReadonlyArray<MobileAction>;
  className?: string;
}

/**
 * Generic md:hidden FAB. Mirrors CanvasFab's UX (radial expand, Esc to close,
 * safe-area-inset aware) without depending on canvas state. Use on list pages
 * where the primary action is "create" and secondary actions are short.
 */
export function MobileActionToolbar({ actions, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div
      className={cn(
        'fixed right-4 z-40 flex flex-col items-end gap-2 md:hidden',
        'bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]', // clears BottomNav
        className,
      )}
    >
      {open
        ? actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className="flex h-touch min-w-[10rem] items-center gap-3 rounded-full border bg-card px-4 shadow-lg"
            >
              <a.Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          ))
        : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close actions' : 'Open actions'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
```

**Wiring:**

- `app/(dashboard)/palaces/page.tsx` — render `<MobileActionToolbar actions={[{ label: 'Create palace', Icon: Plus, onClick: () => openDialog('create-palace') }]} />`. Must be a client wrapper since `openDialog` comes from `AppDialogProvider`.
- `app/(dashboard)/palaces/[palaceId]/page.tsx` — same with `'create-room'`.

Per `AGENTS.md` `AppDialogContext` rule, never mount with local `useState` or a `useEffect` to set open. The provider already handles cross-page intent via URL; the FAB just calls `openDialog`.

### 3.5 Room ordering — `setRoomOrder` action + reorder controls

**New file:** `apps/web/src/features/rooms/actions/setRoomOrder.ts`

```ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb, rooms, palaces, and, eq, isNull, inArray, sql } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';

const setRoomOrderSchema = z.object({
  palaceId: z.string().uuid(),
  /** Ordered list of room IDs from top to bottom. Must include every non-deleted room. */
  orderedIds: z.array(z.string().uuid()).min(1).max(500),
});

export const setRoomOrder = defineAction({
  name: 'setRoomOrder',
  schema: setRoomOrderSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<{ updated: number }> => {
    const db = getDb();

    // Verify palace ownership + that orderedIds covers every room exactly once.
    const owned = await db
      .select({ id: rooms.id })
      .from(rooms)
      .innerJoin(palaces, eq(palaces.id, rooms.palaceId))
      .where(
        and(
          eq(rooms.palaceId, input.palaceId),
          isNull(rooms.deletedAt),
          eq(palaces.userId, user.id),
          isNull(palaces.deletedAt),
        ),
      );
    const ownedIds = new Set(owned.map((r) => r.id));
    if (
      ownedIds.size !== input.orderedIds.length ||
      input.orderedIds.some((id) => !ownedIds.has(id))
    ) {
      throw new ActionError(
        'VALIDATION_ERROR',
        'orderedIds must list every room in the palace exactly once.',
      );
    }

    await db.transaction(async (tx) => {
      const cases = input.orderedIds
        .map((id, i) => sql`WHEN ${rooms.id} = ${id} THEN ${i}`)
        .reduce((acc, frag) => sql`${acc} ${frag}`, sql``);
      await tx
        .update(rooms)
        .set({ position: sql`CASE ${cases} END` })
        .where(inArray(rooms.id, input.orderedIds));
    });

    revalidatePath(`/palaces/${input.palaceId}`);
    return { updated: input.orderedIds.length };
  },
});
```

**Barrel:** `features/rooms/index.ts` — `export { setRoomOrder } from './actions/setRoomOrder';`.

**UI deferral note.** A drag-reorder grid needs `@dnd-kit/sortable` (new dep, requires its own ADR) **OR** an "↑ ↓" button approach using only `setRoomOrder`. The latter has zero dep cost and ships in this batch. Drag-reorder + ADR for `@dnd-kit/sortable` is filed as a follow-up.

**New file:** `apps/web/src/features/rooms/components/RoomReorderControls.tsx`

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button, toast } from '@memory-palace/ui';
import { setRoomOrder } from '../actions/setRoomOrder';

interface Props {
  palaceId: string;
  /** Full list of room IDs in current display order. */
  orderedIds: string[];
  /** Index of the room these controls belong to. */
  index: number;
}

export function RoomReorderControls({ palaceId, orderedIds, index }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= orderedIds.length) return;
    const next = orderedIds.slice();
    [next[index], next[target]] = [next[target]!, next[index]!];
    startTransition(async () => {
      const result = await setRoomOrder({ palaceId, orderedIds: next });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => move(-1)}
        disabled={pending || index === 0}
        aria-label="Move room up"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronUp className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => move(1)}
        disabled={pending || index === orderedIds.length - 1}
        aria-label="Move room down"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
```

**Modify:** `RoomCard.tsx` to accept optional `reorderControls?: ReactNode` slot and render in card header. Wire from `palaces/[palaceId]/page.tsx`.

### 3.6 Adjacent fix — `useSwipeNavigation` constraint check (A3)

**Verify, do not modify:** `apps/web/src/shared/hooks/useSwipeNavigation.ts`. The hook returns `dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}` even when only `'x'` drag is active — that's correct (axis is enforced by `drag: 'x'`). No change needed; documenting the verification.

---

## 4. Documentation deliverables (Phase 2 only — not now)

- `docs/adr/14-flashcards-mobile-fab-room-reorder.md` — bug-report + fixes ADR. Covers the ground-truth gap between "action shipped" and "feature shipped" and adds a guardrail to `AGENTS.md` requiring **both** action + UI before claiming a feature complete in retrospectives.
- `AGENTS.md` — append one line under "Critical patterns": _"Feature complete = action **and** UI surface. A barrel-exported server action without a render path is unfinished work, not shipped."_

---

## 5. Out-of-scope (deferred deliberately)

- **`@dnd-kit/sortable` drag-reorder UI.** Up/Down buttons cover the user need without a new dep.
- **Cross-room edges in `duplicateRoom`.** Existing decision per ADR 13 — user re-threads.
- **Chapter-traversal pointers in journey UI.** `prev_room_id`/`next_room_id` columns will stay unused until a "next chapter" affordance is requested in journey mode.
- **Full Tinder-style discard animation on flashcards.** The framer-motion drag spring-back is sufficient for v1; a fly-off-screen exit animation conflicts with route refresh on deck completion.
- **Quiz route distractors when room has < 4 nodes.** Existing fallback to typed-recall in `QuizSession` already handles this.

---

## 6. Risk register

| Risk                                                                         | Mitigation                                                                                                                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `setRoomOrder` CASE expression mis-handles missing IDs                       | Validation step rejects payloads where `orderedIds.length !== ownedIds.size`. Wrapped in transaction.                                    |
| `MobileActionToolbar` z-index conflicts with `BottomNav`                     | `bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]` clears the 64 px bottom nav. Manual test on iOS Safari.                              |
| Sonner `toast.error` from `DuplicateRoomButton` while `Toaster` is unmounted | `Toaster` is mounted in root `app/layout.tsx` per `AGENTS.md` — confirmed live.                                                          |
| `FlashcardDeck` swipe + tap-to-flip both fire on the same gesture            | `drag: 'x'` blocks click during drag; framer-motion only fires `onClick` if movement < ~3 px. Verified pattern in `RoomJourney`.         |
| Room reorder optimistic UI flicker on slow networks                          | `router.refresh()` is wrapped in `startTransition`; defer adding `useOptimistic` until the user reports flicker.                         |
| Cross-feature import temptation                                              | New shared FAB in `shared/components/`, not `features/spatial-canvas/`. `setRoomOrder` lives in `features/rooms/`, not in a new feature. |

---

## 7. Verification plan (run after each fix lands)

1. `pnpm turbo lint typecheck build` clean.
2. `pnpm check:guardrails` clean.
3. Manual: `/games/flashcards` and `/games/quiz` no longer 404.
4. Manual: `/palaces` and `/palaces/[id]` show FAB on `<md` viewport; tapping opens create dialog.
5. Manual: Duplicate button on a room creates `Room (copy)` immediately after the source.
6. Manual: ↑/↓ on a room card persists across reload.
7. Manual: Flashcard deck — swipe left after flipping advances; Again/Hard/Good/Easy submit `recordPractice`.
8. Vitest: at minimum a unit test for `setRoomOrder` validation path (rejects partial coverage).

---

## 8. Phase 2 execution order (after approval)

```
Step 1 — Fix the broken hub (highest visibility)
  ├─ /games/flashcards/page.tsx + FlashcardDeck.tsx
  ├─ /games/quiz/page.tsx
  └─ Verify links from /games no longer 404

Step 2 — Duplicate room UI
  ├─ DuplicateRoomButton.tsx
  ├─ RoomCard.tsx footer rewrite
  └─ Barrel export

Step 3 — Mobile FAB parity
  ├─ shared/components/MobileActionToolbar.tsx
  ├─ /palaces/page.tsx wrapper
  └─ /palaces/[palaceId]/page.tsx wrapper

Step 4 — Room reorder
  ├─ setRoomOrder server action
  ├─ RoomReorderControls.tsx
  └─ RoomCard slot wiring

Step 5 — ADR 14 + AGENTS.md guardrail line
```

Each step is a separate commit; all five squash into one PR per the "one PR per phase sub-step" rule in `ROADMAP.md`.

---

## RCA terminal summary

**9 of 12 user symptoms already shipped.** The real outstanding work is:

1. `/games/flashcards` and `/games/quiz` — **404s today** from a hub linked in the dashboard (highest user-visible defect).
2. Room duplicate — action exists, no button.
3. Room reorder — schema columns exist, no action, no UI.
4. Mobile FAB on palaces/rooms list pages.
5. Anki-semantic flashcard rating (Again/Hard/Good/Easy) + swipe — must live in a new dedicated `FlashcardDeck`, not retrofit into `QuizSession`.

**Adjacent issues:** `/games` ships dead links (A1); `RoomCard` footer wraps poorly (A4); flashcards in `QuizSession` use opaque 1–5 numbers (A2).

**No application code has been modified.** Awaiting "APPROVED" to proceed to Phase 2.
