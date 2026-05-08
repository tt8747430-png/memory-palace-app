# ADR 9B — Journey viewer, statistics dashboard, and undo flow

**Status:** Accepted
**Date:** 2025-04
**Phase:** Slice B (post-9A)

## Context

After the practice/SR engine landed in ADR 9A, the next slice from
`docs/plans/IMPLEMENTATION_APP_PLAN.md` covers three orthogonal UX
improvements that share a common goal — _make the app feel calm and
recoverable_:

1. **Journey viewer** — a sequential, full-screen reading mode that walks
   through a room's nodes one at a time, ordered by canvas position.
2. **Statistics dashboard** — a single panel that surfaces practice
   activity (overview, weakest nodes, recent history, weekly heatmap).
3. **Undo for destructive actions** — soft-delete already protects the
   data; we needed the UI to expose the recovery path within a short
   window.
4. **Duplicate palace** — a frequently-requested escape hatch for users
   who want to fork a structure without re-creating every room/node.

A foundational dependency for all four is a unified toast surface; we
chose [`sonner`](https://sonner.emilkowal.ski/) because it is the
shadcn/ui-recommended toaster, ships an action-button API ideal for
"Undo", and is small (~3 kB).

## Decision

### Toaster

- Add `sonner` as a direct dependency of `@memory-palace/ui` and
  re-export `Toaster` and `toast` from the package barrel.
- Wrap sonner with a `Toaster` component in
  `apps/web/src/shared/components/Toaster.tsx` to centralise theming
  (`richColors`, `closeButton`, custom card styling).
- Mount the wrapper once in the **root** layout (`app/layout.tsx`) so
  toasts work on marketing, auth, and dashboard surfaces.

### Undo flow

- A short-lived (30 s) HMAC-SHA256 token encodes `{ kind, id, userId,
exp }` as `<base64url payload>.<base64url signature>`. Verified with
  `crypto.timingSafeEqual` to avoid timing leaks. Implemented in
  `shared/lib/undoToken.ts`.
- `deletePalace` returns `{ id, undoToken }`. `restorePalace` accepts
  `{ undoToken }`, verifies kind + signature + expiry, ensures
  `payload.userId === request user.id`, and clears `deleted_at`.
- The 30 s TTL is shorter than typical user attention but long enough
  for the toast action button. We prefer **stateless** tokens over a
  server-side undo log because the only authoritative state is the
  database row's `deleted_at` flag; no extra schema is required.
- Secret resolution order in `getSecret()`:
  `UNDO_TOKEN_SECRET` → Supabase publishable key → in-code dev fallback.
  Rotating either invalidates outstanding tokens; that is acceptable for
  a 30 s window.

### Duplicate palace

- Single transaction: select source palace + rooms + nodes; insert new
  palace (title appended with `" (copy)"`); insert new rooms preserving
  position; insert new nodes preserving `(positionX, positionY)`,
  content, color, and type; re-attach `node_tags` by tag **name** with
  `ON CONFLICT DO NOTHING`.
- Edges, review state, and practice sessions are **not** copied —
  edges depend on graph identity, and review state belongs to each
  individual node's learning history.
- Rate limited via `rateLimit: 'write'`.

### Statistics panel

- `StatisticsPanel` lives in **`features/practice/components/`**, not
  `features/dashboard/components/`. Same boundary deviation as ADR 9A's
  `StreakCounter`: importing `getPracticeStats` from a `dashboard`
  component would breach `eslint-plugin-boundaries`. Route files
  (`app/(dashboard)/dashboard/page.tsx`) remain free to import the
  practice barrel.
- A thin RSC wrapper, `app/(dashboard)/dashboard/_components/
StatisticsPanelSection.tsx`, fetches the stats once, returns `null`
  when `totalPracticed === 0`, and forwards the data to the
  client-rendered panel.
- Tabs (`Overview`, `Weakest`, `History`, `Activity`) use
  `role="tablist"`/`role="tab"`/`aria-selected`. The 7-day heatmap is
  rendered with **plain Tailwind cells** (`bg-primary/20..100`) — no
  Recharts dependency. Adding a charting library is explicitly deferred
  until a real product need emerges.

### Journey viewer

- `RoomJourney` (client) renders the sequential reader. Server provides
  a sorted, projected `JourneyNode[]` so the client never reaches into
  spatial canvas internals.
- Sort key is `(positionY, positionX)` — top-to-bottom, left-to-right.
  This matches reading order on the canvas without requiring an extra
  user-facing reordering step.
- Keyboard: `ArrowRight` / `Space` advance, `ArrowLeft` goes back.
- Progress dots use `aria-current="step"` on the active step.
- Animations use framer-motion `m.article` (LazyMotion is mounted at
  the app root); reduced-motion is honoured globally via the
  `MotionConfig` provider — no local `useReducedMotion()` hook.
- Route lives at
  `app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/journey/page.tsx`
  as a full-`100dvh` takeover. The room canvas page now exposes a
  "Start journey" link when the room has at least one node.

## Consequences

### Positive

- Destructive actions now feel **forgiving**: deleting a palace is a
  single-click action with a 30-second undo window. The
  `restorePalace` action is idempotent — calling it after the row is
  already restored returns `NOT_FOUND` rather than corrupting state.
- Statistics finally close the loop on the SM-2 engine — users can see
  weekly activity, weakest nodes, and recent attempts without leaving
  the dashboard.
- Journey viewer adds a no-friction "review reading" mode that
  complements (not replaces) the practice quiz, satisfying a common
  pattern in spaced-repetition apps.
- Sonner becomes the **only** toast surface in the codebase (rule
  enforced by importing `toast` exclusively from `@memory-palace/ui`),
  unblocking future Slice C UX polish work.

### Negative / trade-offs

- The HMAC secret falls back to the Supabase publishable key in
  development, which is a public token. We accept this for local
  development but document a `UNDO_TOKEN_SECRET` env var for
  production. CI does not yet enforce its presence — added to the
  Slice B follow-ups.
- Statistics tabs are entirely client-rendered; server-side projection
  - URL-driven tab state would be more elegant but is over-engineered
    for a dashboard widget that already loads its data from one server
    action.
- `duplicatePalace` is implemented with a single batched transaction.
  A user with very large palaces could hit the Postgres parameter
  limit (~32k); a future ADR will introduce chunked inserts when that
  becomes a real constraint.

### Boundary deviation (recurring)

The `eslint-plugin-boundaries` rule forbids `dashboard → practice`
imports. We continue the ADR 9A pattern of placing
practice-flavoured UI inside `features/practice/components/` and
wiring it from the route. Adding a `dashboard-widgets` shared
boundary would be a more principled fix; tracked as a follow-up.

## Files touched

**New**

- `apps/web/src/shared/components/Toaster.tsx`
- `apps/web/src/shared/lib/undoToken.ts`
- `apps/web/src/shared/lib/__tests__/undoToken.test.ts`
- `apps/web/src/features/palaces/actions/restorePalace.ts`
- `apps/web/src/features/palaces/actions/duplicatePalace.ts`
- `apps/web/src/features/palaces/components/DuplicatePalaceButton.tsx`
- `apps/web/src/features/practice/components/StatisticsPanel.tsx`
- `apps/web/src/features/rooms/components/RoomJourney.tsx`
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/journey/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/_components/StatisticsPanelSection.tsx`

**Modified**

- `packages/ui/src/index.ts` — re-export sonner `Toaster`/`toast`.
- `packages/ui/package.json` — add `sonner` dependency.
- `apps/web/src/app/layout.tsx` — mount `<Toaster />`.
- `apps/web/src/features/palaces/actions/deletePalace.ts` — return undo token.
- `apps/web/src/features/palaces/components/DeletePalaceButton.tsx` — toast undo.
- `apps/web/src/features/palaces/components/PalaceCard.tsx` — duplicate button.
- `apps/web/src/features/palaces/index.ts` — barrel updates.
- `apps/web/src/features/rooms/index.ts` — re-export `RoomJourney`.
- `apps/web/src/features/practice/index.ts` — re-export `StatisticsPanel`.
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/page.tsx`
  — "Start journey" link.
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — mount stats section.

## Follow-ups (deferred)

- Apply the same undo pattern to `deleteRoom` and `deleteNode`.
- `useOptimistic` in the palace grid for delete + duplicate (the
  current implementation calls `router.refresh()`).
- E2E spec (`playwright/tests/journey.spec.ts`) covering the journey
  flow and undo toast.
- CI presence check for `UNDO_TOKEN_SECRET` in production.
