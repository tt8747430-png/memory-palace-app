# Implementation Plan — Porting MemoryPalaces & TalantulApp Inspiration

> **Status:** Draft for approval (Phase 1 of two-phase task).
> **Scope:** Identify what to port from the two reference apps in `docs/exampe_app/`, define a concrete refactor for our React 19 / Next.js 16 codebase, and update the aspirational docs (`docs/archive/*`) and current `ROADMAP.md` accordingly.
> **Constraints honoured:** `.project_memory.md` (proxy.ts, semantic tokens, mobile-first, no `max-*:`, `cn` from `@memory-palace/ui`, named exports, no cross-feature imports, server actions = Zod → rate-limit → Drizzle → `ActionResponse<T>`, DB helpers from `@memory-palace/db` only, Tailwind v4 `@theme inline`).

---

## 1. Sources Audited

### 1.1 MemoryPalaces (`docs/exampe_app/MemoryPalaces/`)

Vanilla-JS PWA, ES modules + EventBus, Firebase optional sync, Vitest. Module map (4,354 LoC total):

| Module                                                                              | LoC  | Role                                                       |
| ----------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------- |
| `UIController`                                                                      | 733  | View orchestrator, lazy-loads sub-views                    |
| `EventHandlers`                                                                     | 615  | DOM wiring, shortcuts, modals                              |
| `PracticeUI`                                                                        | 484  | Quiz session UI (multiple-choice + typed recall)           |
| `SyncManager`                                                                       | 340  | Firebase Auth + Firestore                                  |
| **`PracticeManager`**                                                               | 332  | **Spaced-repetition engine, mastery, streaks, history**    |
| `PalaceManager`                                                                     | 319  | localStorage CRUD (we already have server-side equivalent) |
| `NotificationManager`                                                               | 212  | Toast + confirm UX                                         |
| `StatisticsUI`                                                                      | 210  | Global stats dashboard, log export                         |
| `HtmlPalaceParser`                                                                  | 188  | HTML → JSON station parser (stations, verses, senses)      |
| `StationEditorUI`                                                                   | 181  | Per-station CRUD                                           |
| `JourneyUI`                                                                         | 167  | Sequential walkthrough viewer (progress dots, zones)       |
| `validation`, `Logger`, `WebVitals`, `EventBus`, `ThemeManager`, `utils`, `version` | ~500 | Cross-cutting infra                                        |

### 1.2 TalantulApp (`docs/exampe_app/MemoryPalaces/public/data/example_website/`)

Static HTML snapshot of the **Talantul în Negoț** biblical-study center website. Tailwind-classed dark theme, FontAwesome icons, fonts: **Space Grotesk** (display) + **Inter** (body). Pages:

- Landing (`Talantul in Negot - Biblical Study Center.html`) — hero + 6-card feature grid (Study & Quiz, Memorization Tools, Interactive Games, Church Competition, Track Progress, Rich Content Library) + "How It Works" 3-step + currently-available section.
- Platform Features — Learning Journey, Lead Your Congregation, Daily Quiz Challenge, How Scoring Works.
- Study Mode, Login, Contact, About, Steps for Churches, Participating Churches.
- `styles/premium-theme.css`: warm-gold (`#d4a853`) accent system + secondaries (emerald, rose, cyan, amber), floating ambient orbs (`.floating-orb`, blur-100px), sparkle field, glassmorphic surfaces (`rgba(18,18,26,0.7)` + `backdrop-blur`).
- `styles/styles.css`: `reveal-up` / `stagger-1..4` scroll-reveal animations, custom scrollbar, `fadeIn` keyframe.

This source is **visual / marketing inspiration only** — no JavaScript logic to port.

---

## 2. Gap Analysis vs. Current App

| Capability                       | Current state                       | MemoryPalaces                   | TalantulApp      | Gap                                                                                           |
| -------------------------------- | ----------------------------------- | ------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| Spaced-repetition engine         | aspirational only (FEATURES §9)     | shipped (`PracticeManager`)     | n/a              | **Missing.** No `practice_sessions` table, no review queue.                                   |
| Quiz / Practice mode             | aspirational only (FEATURES §3, §5) | shipped (`PracticeUI`)          | "Daily Quiz"     | **Missing.**                                                                                  |
| Sequential walkthrough (journey) | none                                | shipped (`JourneyUI`)           | "Study Mode"     | **Missing.**                                                                                  |
| Statistics / analytics page      | aspirational (FEATURES §10)         | shipped (`StatisticsUI`)        | "Track Progress" | **Missing.** Dashboard `StatsBar` exists but it's just counts.                                |
| Streak counter                   | placeholder in WelcomeBanner        | shipped (per-palace + global)   | implied          | Partial — no real streak source.                                                              |
| Toast / undo-delete              | none (we use server-action errors)  | shipped (`NotificationManager`) | n/a              | **Missing.**                                                                                  |
| Duplicate palace / room          | none                                | shipped (`duplicatePalace`)     | n/a              | **Missing.**                                                                                  |
| Bidirectional palace connections | edges are node-level only           | shipped (palace.connections[])  | n/a              | Optional extension.                                                                           |
| HTML → JSON content import       | JSON import only (Phase 4C.3)       | shipped (`HtmlPalaceParser`)    | n/a              | Optional — defer.                                                                             |
| Premium gold-accent palette      | neutral semantic tokens             | n/a                             | shipped (gold)   | Add **accent palette** (gold/emerald/rose/cyan/amber) as semantic tokens; opt-in per surface. |
| Display font (Space Grotesk)     | Inter only                          | n/a                             | shipped          | Add `--font-display` for marketing headings.                                                  |
| Marketing landing 6-card grid    | exists (`(marketing)/page.tsx`)     | n/a                             | shipped          | Visual upgrade only — gradient header strips + glass surfaces.                                |
| Ambient orb backdrop (marketing) | none                                | n/a                             | shipped          | Add as **opt-in** decorative layer (CSS-only, `motion-reduce:` aware).                        |
| Reveal-up scroll animations      | `PageTransition` only               | n/a                             | shipped          | Add IntersectionObserver-driven reveal hook (reduced-motion safe).                            |
| Public competition / leaderboard | none                                | n/a                             | shipped (church) | **Out of scope** for this refactor — defer.                                                   |
| PWA + service worker             | none (next-pwa not chosen)          | shipped                         | n/a              | **Out of scope** — separate phase, requires ADR.                                              |

---

## 3. Refactor / Implementation Slices

The work splits into **three independent slices** that can ship in any order. Each slice is self-contained: a slice has its own ADR, migration, server actions, UI, and tests.

### 3.1 Slice A — Practice / Spaced Repetition (Phase 9A in roadmap)

**New files:**

- `packages/db/src/schema.ts` — append two tables (additive migration, no destructive change):

  ```ts
  export const practiceSessions = pgTable(
    'practice_sessions',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      nodeId: uuid('node_id')
        .notNull()
        .references(() => nodes.id, { onDelete: 'cascade' }),
      score: integer('score').notNull(), // 0–100
      correct: boolean('correct').notNull(),
      mode: text('mode').notNull(), // 'multiple-choice' | 'typed-recall' | 'flashcard'
      practicedAt: timestamp('practiced_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index('practice_sessions_user_node_idx').on(t.userId, t.nodeId)],
  );

  export const nodeReviewState = pgTable('node_review_state', {
    nodeId: uuid('node_id')
      .primaryKey()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    practiceCount: integer('practice_count').notNull().default(0),
    streak: integer('streak').notNull().default(0),
    mastery: real('mastery').notNull().default(0), // 0–100, exponentially weighted
    lastPracticed: timestamp('last_practiced', { withTimezone: true }),
    nextReview: timestamp('next_review', { withTimezone: true }),
    easeFactor: real('ease_factor').notNull().default(2.5), // SM-2
    interval: integer('interval').notNull().default(0), // days
  });
  ```

  RLS policies mirror `nodes` (chain through `node_id → room_id → palace_id → user_id`).

- `apps/web/src/features/practice/` — new feature dir (`eslint-plugin-boundaries` will allow it once added; no cross-feature imports).
  - `actions/getDueNodes.ts` — `ActionResponse<DueNodeWithMeta[]>`. Postgres index on `next_review`; cursor-paginated (re-uses `shared/lib/cursor.ts`).
  - `actions/recordPractice.ts` — Zod input `{ nodeId, score, mode, correct }`; rate-limited via `checkRateLimit(userId, 'write')`; transactionally upserts `practice_sessions` + recalculates `node_review_state` using SM-2 (port of `PracticeManager.getInterval`, replaced by SM-2 from FEATURES §9).
  - `actions/getPracticeStats.ts` — global stats (totalPracticed, weakest nodes top 5, recent sessions top 8, weekly activity[7]). Mirror of `PracticeManager.getGlobalStats`.
  - `lib/srs.ts` — pure SM-2 reducer. Vitest unit-tested.
  - `components/QuizSession.tsx` — **client component** built around `useActionState` (React 19) + `useTransition` for non-blocking next-question prefetch. Modes: `multiple-choice` (4 distractors from sibling nodes via `getNodesByRoom`), `typed-recall` (string compare with diacritic-folding from `validation.js`), `flashcard` (front/back, self-rated 1–5).
  - `components/PracticePicker.tsx` — list of due / all nodes with badges (`Due Now`, `mastery%`). Mirrors `PracticeUI.renderSelector`.
  - `components/DailyReviewCta.tsx` — dashboard card. Reads `getDueNodes({ limit: 1 })` server-side via the dashboard layout.
- `apps/web/src/app/(dashboard)/practice/page.tsx` + `[nodeId]/page.tsx` — RSC skeleton + client `QuizSession`.
- `apps/web/src/features/dashboard/components/StreakCounter.tsx` — derived from `node_review_state.streak` aggregate. Replaces the placeholder in `WelcomeBanner`.

**React 19 / Next.js 16 features used:**

- `useActionState` for the quiz form (already an established pattern in `features/auth/`).
- `useTransition` to prefetch next question without blocking UI (the existing patterns in `features/spatial-canvas/` use it for batch saves; same shape).
- **No** `useEffect` for state sync — derive during render (per ADR pattern documented in `.project_memory.md` and Phase 5B notes).
- RSC `cache()` for `getDueNodes` reads inside the dashboard layout to avoid a duplicate round-trip with `DailyReviewCta`.
- Streaming + `Suspense` boundaries around the quiz session so the picker is interactive while questions load.

**Tests:**

- `lib/srs.ts` — Vitest (table-driven: 0/30/60/90/100 score combinations against expected interval/ease).
- `actions/recordPractice.ts` — integration (real DB) covering: ownership check, rate-limit, idempotency on rapid double-submit.
- `components/QuizSession.test.tsx` — RTL: keyboard navigation 1-4 to pick answer, Enter to submit, ESC to close.
- Playwright: full happy-path quiz (10 questions, mixed modes).

**Edge cases / regression prevention:**

- A node deleted mid-quiz: `recordPractice` rejects with `error.code = 'NOT_FOUND'`; the client drops the card and moves on (no toast).
- `node_review_state` row missing on first practice: upsert pattern `INSERT … ON CONFLICT (node_id) DO UPDATE`.
- Fewer than 4 nodes in a room: multiple-choice falls back to typed-recall.
- Diacritic-folding for typed answers (Romanian content from TalantulApp) — `string.normalize('NFD').replace(/\p{Diacritic}/gu, '')`.
- No content drift: the SM-2 implementation is pure; the legacy `[1,3,7,14,30,60,120]` interval table is **discarded** in favour of SM-2 (FEATURES §9 already mandates SM-2 — no roadmap change needed except marking 9A as planned).

### 3.2 Slice B — Journey Viewer + Statistics + UX polish (Phase 9B / 9D)

**New files:**

- `apps/web/src/features/rooms/components/RoomJourney.tsx` — sequential viewer over `nodes` ordered by `(positionY, positionX)`. Uses Framer Motion `m.div` + the existing `MotionProvider`. Progress dots adapt the `JourneyUI` HTML structure into `aria-current="step"` semantics.
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/journey/page.tsx` — full-screen takeover (`100dvh`).
- `apps/web/src/features/dashboard/components/StatisticsPanel.tsx` — calls `getPracticeStats`. Tabs: Overview · Weakest · History · Activity (re-uses Recharts? — **no new dep**: render the 7-day strip inline with Tailwind grid + `bg-primary/N` cells. ADR explicitly defers Recharts.).
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — wire `StatisticsPanel` and `StreakCounter`.

**Existing files modified:**

- `apps/web/src/features/palaces/actions/deletePalace.ts` — return `{ undoToken: string }` on success (signed JWT, 30 s TTL); add `restorePalace(undoToken)` action. Powers the toast undo.
- `apps/web/src/features/palaces/actions/duplicatePalace.ts` — new action. Copies palace + rooms + nodes (no edges, no review state) in a single transaction.
- `apps/web/src/shared/components/Toaster.tsx` — new (uses `sonner` — single dep, ADR required). Replaces ad-hoc error states in `useActionState` callsites.
- `packages/ui/src/index.ts` — re-export `Toaster`, `toast` from sonner so `cn`-rule symmetry is preserved (no direct sonner import outside `packages/ui`).

**React 19 features:**

- `useOptimistic` for the duplicate / delete actions on the palace grid (instant UI feedback before the server confirms).
- `cache()` in `RoomJourney` server fetch for nodes ordering.

**Edge cases / regression prevention:**

- Delete-undo is **soft delete** (existing `deleted_at`) — no hard delete during the 30-second window. The proxy/RLS view filter excludes soft-deleted rows already.
- Duplicate creates a new `palace.id` — node `position_x/y` copied verbatim; tags by name re-attached idempotently (`ON CONFLICT DO NOTHING` on `node_tags`).
- The journey viewer must respect `prefers-reduced-motion` — re-uses `MotionConfig reducedMotion="user"` from `MotionProvider`; no local hook needed (per `.project_memory.md`).
- Statistics panel shows skeleton during `Suspense` boundary — re-uses `CardSkeleton` from `shared/components/`.

### 3.3 Slice C — Premium theme tokens + marketing visual upgrade

**Existing files modified:**

- `apps/web/src/app/globals.css` — add **opt-in accent palette** as Tailwind v4 `@theme inline` tokens (no `tailwind.config.ts`, ADR-003 stays in effect):

  ```css
  :root {
    /* Existing tokens unchanged. */
    --gold: hsl(38 60% 58%); /* #d4a853 */
    --emerald: hsl(160 84% 39%);
    --rose: hsl(347 91% 61%);
    --cyan: hsl(189 95% 53%);
    --amber: hsl(38 92% 50%);
  }
  .dark {
    --gold: hsl(38 70% 65%);
    /* … darker-mode variants */
  }
  @theme inline {
    --color-gold: var(--gold);
    --color-emerald: var(--emerald);
    --color-rose: var(--rose);
    --color-cyan: var(--cyan);
    --color-amber: var(--amber);

    --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  }
  ```

  **Constraint preserved:** new tokens are **semantic** (`gold`, `emerald` are accent roles). Raw hex is forbidden at call sites (`.project_memory.md` rule).

- `apps/web/src/app/layout.tsx` — add Space Grotesk via `next/font/google` next to the existing Inter import. Apply `--font-display` only to `(marketing)` headings.
- `apps/web/src/app/(marketing)/_components/AmbientOrbs.tsx` — pure CSS, no JS. `position: fixed; pointer-events: none;` + `motion-reduce:hidden`. Mounted only in `(marketing)/layout.tsx`. Z-index below content.
- `apps/web/src/shared/hooks/useReveal.ts` — IntersectionObserver hook. Adds `data-revealed="true"`. Class `.reveal-up` defined in `globals.css` with `motion-reduce:transition-none`. Used only in `(marketing)/page.tsx`.
- `apps/web/src/app/(marketing)/page.tsx` — replace existing hero with 6-card gradient grid mirroring TalantulApp's landing (Study & Quiz / Memorization / Games / Connect / Track Progress / Library — **rephrased to match our domain**, not Talantul's biblical content). Each card: gradient header strip (`bg-gradient-to-r from-primary to-accent`), icon (lucide), title, two-line description.

**Constraint preserved:**

- No `max-*:` breakpoints — mobile-first base + `md:` upgrades.
- All touch targets `≥48px` (`h-touch`).
- `cn` from `@memory-palace/ui`.
- No `tailwind.config.ts` — ADR-003.
- Glassmorphic surfaces use `bg-card/70 backdrop-blur-md` — existing `card` token, not raw colours.

**No new runtime deps** apart from `sonner` (Slice B). `next/font/google` for Space Grotesk is a build-time addition, not a runtime dep.

---

## 4. Updates to Aspirational Docs & ROADMAP

These are **doc-only** edits delivered alongside Slice A (the first slice to ship). They consolidate the audit into the canonical source of truth.

| File                                          | Change                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ROADMAP.md`                                  | Move Phase 9 to "Next" with the three-slice breakdown (9A Practice, 9B Journey/Stats/UX, 9C Premium theme). Keep one PR per slice rule.                                                                                                                                                                 |
| `docs/archive/ROADMAP-aspirational.md`        | Mark Phase 9 sub-phases A/B/D as the slices above; remove the "Memory Games" sub-phase (defer to v1.5+, the SR engine + quiz cover the engagement need).                                                                                                                                                |
| `docs/archive/FEATURES-aspirational.md`       | §2 Daily Memory Review, §3 Memory Games, §4 Gamification, §5 Study Mode, §9 SR engine — replace per-feature pseudocode with cross-references to `features/practice/`, `features/rooms/components/RoomJourney.tsx`, etc. Keep the "what users see" prose; drop the speculative APIs.                     |
| `docs/archive/UI_STYLE_GUIDE-aspirational.md` | §3 Color & Theme System — append the gold/emerald/rose/cyan/amber accent block as **opt-in semantic tokens**, not defaults. §5 Typography — add `--font-display` Space Grotesk. §11 Animation — add `reveal-up` IntersectionObserver pattern + `AmbientOrbs` decorative spec with reduced-motion notes. |
| `docs/archive/ARCHITECTURE-aspirational.md`   | Add `practice_sessions` and `node_review_state` to the schema diagram. Note RLS chain. Add `features/practice/` to the feature dir list.                                                                                                                                                                |
| `docs/archive/PERFORMANCE-aspirational.md`    | Add: SR queue prefetch (RSC `cache()`), quiz next-question prefetch (`useTransition`), AmbientOrbs as CSS-only (no JS, no LCP impact).                                                                                                                                                                  |
| `.project_memory.md`                          | After Slice A merges: append "Phase 9A — SR engine, `practice_sessions` + `node_review_state` tables, SM-2 in `features/practice/lib/srs.ts`." After Slice C: append "Accent palette (`--color-gold`/`emerald`/`rose`/`cyan`/`amber`) is opt-in for marketing only."                                    |
| New ADRs (Phase 2 of this task)               | `docs/adr/9a-spaced-repetition.md`, `docs/adr/9b-journey-stats-ux.md`, `docs/adr/9c-premium-theme.md`, `docs/adr/sonner-toaster.md`.                                                                                                                                                                    |

---

## 5. Out-of-Scope (Explicitly Deferred)

- **PWA / service worker.** Requires its own ADR; conflicts with Vercel ISR semantics; adds release-versioning surface (the MemoryPalaces three-place version sync is exactly the brittleness we want to avoid).
- **Firebase sync.** Supabase already covers auth + cloud sync.
- **Public leaderboard / community / "Lead Your Congregation".** TalantulApp's church-competition framing doesn't fit our generic memory-palace product. Revisit only if user research demands it.
- **HTML → JSON palace import.** Niche import path; the existing JSON import (Phase 4C.3) already covers the "share between users" use case.
- **Memory Games sub-feature** (matching, association challenge from FEATURES §3). The SR engine + quiz cover the same engagement loop with one-tenth the surface area. Defer to v1.5.
- **Recharts / chart library.** The 7-day activity strip is rendered with Tailwind cells; the weekly bar is rendered with a div. No chart dep until we have a chart-heavy view.

---

## 6. Risk Register

| Risk                                               | Mitigation                                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two new tables on a live DB                        | Additive migration, generated via `pnpm --filter @memory-palace/db generate`. RLS policies committed in the same migration. No backfill needed (rows lazy-init). |
| SR algorithm regressions                           | Pure reducer in `lib/srs.ts`, table-driven Vitest covers 0/30/60/90/100 + ease-factor edges before any UI integration.                                           |
| Sonner JSX-runtime collision with React 19         | Pin `sonner@^1.7` (verified React-19-compatible); add to ADR. Re-export through `packages/ui` to keep `cn`-rule symmetry.                                        |
| AmbientOrbs hurting LCP on `/`                     | Pure CSS, fixed-position, behind content (z-index `0`, content `1`). `pointer-events: none`. `motion-reduce:hidden` removes them entirely for users who opt out. |
| Accent tokens leaking into product surfaces        | ESLint rule (`no-restricted-syntax`) on `*.tsx` outside `(marketing)/` to disallow `text-gold`/`bg-gold`/etc. Mentioned in `.project_memory.md` after Slice C.   |
| Cross-feature import temptation (practice → nodes) | `practice/actions/getDueNodes.ts` queries `nodes` via the `db` package directly; **no** import from `features/nodes/`. `boundaries` config already enforces.     |

---

## 7. Acceptance Criteria for Phase 2 (Execution)

1. All three slices land **independently** behind separate PRs (one PR per slice, squashed to `main`).
2. `pnpm turbo lint typecheck build` clean on every slice.
3. `pnpm check:guardrails` passes (no `middleware.ts`, no raw hex in `*.tsx`).
4. New tests: ≥ 95% line coverage on `lib/srs.ts`; integration coverage on every new server action.
5. Playwright happy-path quiz spec passes headlessly in CI.
6. ADRs (9A, 9B, 9C, sonner) merged.
7. Aspirational docs + `.project_memory.md` updated in the same PR as the slice they describe.

---

## 8. Suggested Execution Order (post-approval)

```
1. Slice A — Practice / SR engine          (largest, unblocks the rest)
   ├── DB migration + RLS
   ├── actions + lib/srs.ts + Vitest
   ├── QuizSession + PracticePicker
   ├── DailyReviewCta + StreakCounter
   └── docs: ROADMAP, FEATURES §2/§9, ADR 9A, .project_memory.md
2. Slice B — Journey / Stats / UX polish   (depends on Slice A's stats data)
   ├── RoomJourney + journey route
   ├── StatisticsPanel
   ├── duplicatePalace + restorePalace + Toaster (sonner)
   ├── useOptimistic on palace grid
   └── docs: FEATURES §10/§5, ADR 9B, ADR sonner
3. Slice C — Premium theme + marketing visual
   ├── Accent tokens + Space Grotesk
   ├── AmbientOrbs + useReveal
   ├── (marketing)/page.tsx redesign
   └── docs: UI_STYLE_GUIDE §3/§5/§11, ADR 9C, .project_memory.md
```

End of plan.
