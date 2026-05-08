# ADR 9A — Practice / Spaced-Repetition Engine

Date: 2026-05-08
Status: Accepted

## Context

The aspirational FEATURES doc (§9) has long mandated a spaced-repetition
engine. The legacy `MemoryPalaces` app shipped a fixed-interval
`PracticeManager` with the table `[1, 3, 7, 14, 30, 60, 120]`, which is naive
and ignores per-attempt quality. None of it had been ported.

We need:

1. Schema + RLS for an append-only attempts log and per-node SR state.
2. A pure SM-2 reducer (testable, deterministic, no clock side-effects).
3. Server actions: `getDueNodes`, `recordPractice`, `getPracticeStats`.
4. UI: practice queue, quiz session with three modes, dashboard CTA + streak.

## Decision

### Algorithm — SuperMemo-2

The SM-2 reducer (`features/practice/lib/srs.ts`) is implemented as a pure
function: `applyReview(state, { score, correct, now }) → state`. Quality
`q ∈ {0..5}` is derived from `(score, correct)`:

| `correct` | `score` | `q` |
| --------- | ------- | --- |
| true      | ≥ 90    | 5   |
| true      | ≥ 70    | 4   |
| true      | < 70    | 3   |
| false     | ≥ 50    | 2   |
| false     | ≥ 25    | 1   |
| false     | < 25    | 0   |

Interval rules:

- `q < 3` → reset to 1 day (lapse).
- First-ever success → 1 day; second success → 6 days; thereafter
  `ceil(prev * EF)`, capped at `maxIntervalDays = 180`.
- EF: `EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`, floored at 1.3.

Mastery is an EWMA over `[0,100]` (alpha = 0.3). Streak resets to 0 on any
miss. The legacy fixed-interval ladder is **discarded**, not adapted.

### Schema (additive)

Two new tables, one new enum:

- `practice_sessions` — append-only attempt log
  (`id, user_id, node_id, score, correct, mode, practiced_at`). Two indexes:
  `(user_id, practiced_at)` for stats, `(node_id)` for per-node history.
- `node_review_state` — per-node SM-2 state
  (`node_id PK, user_id, practice_count, streak, mastery, ease_factor, interval_days, last_practiced, next_review`).
  Indexes: `(user_id, next_review)` for the due queue,
  `(user_id)` for stats aggregations.

`node_review_state` is lazy-initialised — the row only appears after the
first practice. `getDueNodes` LEFT JOINs so never-practiced nodes surface in
the queue too.

RLS chains through `node_id → room_id → palace_id → user_id` (matching the
existing `nodes` policy shape).

### Server actions

All three live in `apps/web/src/features/practice/actions/` and use the
shared `defineAction` envelope (auth + Zod + rate-limit + `ActionResponse<T>`):

- **`getDueNodes`** — LEFT JOIN against `node_review_state` with the predicate
  `nodeReviewState.nodeId IS NULL OR nodeReviewState.nextReview <= now()`.
  Ordered `next_review ASC NULLS FIRST, created_at`. No rate-limit (read).
  Optional palace/room filter; default limit 20, max 50.

- **`recordPractice`** — `rateLimit: 'write'`. Verifies node ownership via the
  `nodes → rooms → palaces` chain (RLS enforces the same; the explicit check
  yields a clean `NOT_FOUND`). Inserts the session row, then upserts
  `node_review_state` with `ON CONFLICT (node_id) DO UPDATE`. Calls
  `revalidatePath('/practice')` and `revalidatePath('/dashboard')`.

- **`getPracticeStats`** — five parallel queries via `Promise.all` (total
  attempts, streak aggregate, weakest 5 nodes, recent 8 sessions, weekly
  histogram via `date_trunc('day', ...)`). The 7-day strip is filled
  client-side from a sparse map so missing days render as zero.

- **`getQuestionContext`** — returns up to 3 random sibling-node titles for
  multiple-choice distractors. Sampled with `ORDER BY random() LIMIT 3` —
  acceptable for ≤ 500 nodes per room.

### UI

- **`QuizSession`** (`'use client'`) — single component handling three modes:
  - **Multiple choice** — 4 options shuffled with Fisher-Yates over an array
    of length ≤ 4. Falls back to typed-recall when `< 1` distractor available
    (rooms with a single node).
  - **Typed recall** — diacritic-folded NFD comparison
    (`features/practice/lib/answer.ts`).
  - **Flashcard** — front/back reveal with 1–5 self-rating; the rating is
    multiplied by 20 to produce a `score`.
- **`PracticePicker`** — RSC list of due nodes with `Due now` / `New` badges
  and mastery percentage.
- **`DailyReviewCta`** — RSC dashboard card. Calls `getDueNodes({ limit: 1 })`
  to decide which copy to render.
- **`StreakCounter`** — small dashboard pill; reads `getPracticeStats` and
  shows `topStreak`.

### Routes

`/practice` (queue) and `/practice/[nodeId]` (single-node quiz). Both `'use
server'` RSC roots; the inner `QuizSession` is the only client component.
Auth is enforced by `proxy.ts` (any non-public segment) and RLS.

## Optimisations specific to this phase

- **EWMA mastery** instead of a windowed average — constant-space, single
  multiplication per review; survives a rolling history without storing it.
- **Lazy review state** — no row until the user has actually practiced. The
  stats action treats missing rows as "never seen", and the due queue uses a
  LEFT JOIN so it surfaces unpracticed nodes at the front of the line.
- **`NULLS FIRST` ordering** — gives never-practiced nodes natural priority
  without a separate query.
- **`Promise.all` in `getPracticeStats`** — five round-trips collapse into
  one wall-clock minimum over a pooled connection.
- **Random sampling for distractors** — `ORDER BY random() LIMIT 3` is fine
  at our row counts; deferring to a vector or k-NN approach is unnecessary.
- **Rate-limit only on `recordPractice`** — reads (queue, stats, distractors)
  are unbounded; writes use the existing `'write'` bucket.

## Boundary deviation from the implementation plan

The plan placed `StreakCounter` under `features/dashboard/components/`, but
the eslint-plugin-boundaries rules forbid dashboard → practice cross-feature
imports, and `StreakCounter` reads `getPracticeStats`. Moved to
`features/practice/components/StreakCounter.tsx`; route files (which are not
"features") import it directly. No boundary exception added.

## Edge cases

- **Node deleted mid-quiz** — `recordPractice` returns `NOT_FOUND`;
  `QuizSession` silently advances.
- **First practice of a node** — `existing` row is undefined, `previous` is
  `initialReviewState()`, the upsert hits the `INSERT` branch.
- **Fewer than one sibling for multiple-choice** — the mode falls back to
  typed-recall during render.
- **Out-of-range `score`** — clamped both by Zod (0–100, integer) and again
  in the SM-2 reducer.
- **Romanian content (legacy TalantulApp data)** — handled by NFD diacritic
  folding plus collapsed-whitespace lowercasing.
