# CLAUDE.md

## What this is

Spatial learning app: drag memory nodes on a 2D canvas. Read `ARCHITECTURE.md` for current-state decisions. `ROADMAP.md` lists what is built and what is next. Anything in `docs/archive/` is **aspirational, not authoritative** — do not infer that a tool listed there is installed.

**Current status:** Phases 1, 2A/2B/2C, 3A–3C, 4, 4C.3, 5A, 5B, 5C, 5D, 6, 7, a post-6/7 refactor (ADR 8), ADR 11 (UX consolidation + ghost-dialog fix), ADR 12 (route-race fix + loading skeletons), ADR 9A (practice / SM-2 spaced-repetition engine), ADR 9B (journey viewer + statistics dashboard + undo flow), and ADR 9C (premium theme tokens + marketing visual upgrade) are complete. Zustand v5, TanStack Query v5, @xyflow/react v12, framer-motion v12, `cmdk`, `sonner`, and `@sentry/nextjs` are all in use. Yjs/CRDT and `kbar` are explicitly not chosen.

## Monorepo

Turborepo + pnpm workspaces. `apps/web/` (Next.js 16.2.4 App Router), `packages/db/` (Drizzle, 7-table schema live on Supabase with RLS enabled), `packages/ui/` (shadcn primitives + `cn`), `packages/eslint-config`, `packages/typescript-config`.

Feature dirs in `apps/web/src/features/<domain>/` are created **only when work starts**. `auth/`, `dashboard/`, `palaces/`, `nodes/`, `rooms/`, `settings/`, and `spatial-canvas/` exist today. Cross-feature imports are forbidden by `eslint-plugin-boundaries`; cross-cutting code goes to `src/shared/`.

**Routing middleware:** Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. A CI guardrail (`scripts/ci/check-guardrails.mjs`) enforces this.

## Critical patterns

- **Supabase clients** — only via `apps/web/src/shared/lib/supabase.ts` (`createSupabaseFromCookies`, `createSupabaseForResponse`, `createSupabaseForProxy`, `auth`). Auth is fully cookie-based via server actions. Never re-implement the cookie `getAll`/`setAll` boilerplate. Browser singleton `createSupabaseBrowser()` in `shared/lib/supabase-browser.ts` is used **only** for Realtime subscriptions — never for data mutations.
- **Env vars** — only via `apps/web/src/shared/lib/env.ts`. Never `process.env.X!` at call sites.
- **Auth enforcement** — proxy + RLS only. Don't add a per-navigation `auth()` round-trip in layouts.
- **DB client** — `import { getDb } from '@memory-palace/db'`. Call once at the top of an action; importing the package does not require `DATABASE_URL`. **All Drizzle query helpers (`eq`, `and`, `sql`, `desc`, etc.) must be imported from `@memory-palace/db`**, not from `drizzle-orm` directly — `@upstash/redis` declares an optional `drizzle-orm` peer that causes pnpm to create two virtual store entries with incompatible types.
- **Server Actions** — Zod validate input → `checkRateLimit(userId, 'write' | 'search')` → Drizzle query. Return either a discriminated union state for `useActionState` flows, or `ActionResponse<T> = { success, data } | { success, error: { code, message } }` for direct callers. Place under `src/features/<domain>/actions/`. Verb-noun camelCase. See `features/auth/actions/` for the React-19 form pattern and `features/palaces/actions/` / `features/nodes/actions/` for the full server-action + rate-limit pattern.
- **Canvas state (Zustand)** — `spatial-canvas/store/canvasStore.ts` defines `createCanvasStore`. Never instantiate at module scope — use `CanvasStoreProvider` (per-mount `useState` factory). Consume via `useCanvasStore(selector)` (reactive) or `useCanvasStoreApi().getState()` (imperative in event handlers).
- **Server data (TanStack Query)** — `QueryProvider` wraps the app. Default `staleTime: 30_000`. Key factory: `roomNodesQueryKey(roomId)` → `['rooms', roomId, 'nodes']`. All mutations in `useRoomNodeMutations` follow: cancelQueries → snapshot → setQueryData → onError rollback → onSettled invalidateQueries.
- **Realtime sync** — Layer 1: `broadcastInvalidate` via `BroadcastChannel` (`shared/lib/cross-tab-sync.ts`) for same-device tabs. Layer 2: `useRealtimeNodes(roomId)` subscribes to Supabase Postgres Changes and invalidates the TanStack Query cache on any `nodes` change.
- **framer-motion** — use `m` (not `motion`) at call sites; requires `MotionProvider` (`LazyMotion + domAnimation`) as an ancestor (mounted in root layout). `MotionProvider` applies `MotionConfig reducedMotion="user"` globally — do not add local `useReducedMotion()` checks, they are redundant. `PageTransition` is enter-only (opacity + 8 px lift); `AnimatePresence` is intentionally absent — `mode="wait"` is incompatible with Next.js App Router because `usePathname()` updates optimistically (before RSC resolves), causing exit/enter cycles against stale content. Node exit animations use the `isExiting` state pattern — `AnimatePresence` at canvas level is incompatible with React Flow's node lifecycle. See `docs/adr/7-animations-polish.md` and `docs/adr/12-route-race-stabilization.md`.
- **Route constants** — `shared/lib/routes.ts` exports `PALACE_PAGE_RE`, `ROOM_ROUTE_RE`, `isOnRoomPage(pathname)`, and `palaceIdFromPath(pathname)`. Import from there; never re-declare locally.
- **AppDialogContext** — `CreatePalaceDialog` and `CreateRoomDialog` are driven by `AppDialogProvider` (`shared/components/AppDialogContext.tsx`). Call `openDialog('create-palace' | 'create-room')` to trigger; `consume()` to dismiss. Never use local open state or a `useEffect` to set open — both are broken under React 19 Strict Mode remounts. Cross-page intent is encoded in the URL (`/palaces?action=create-palace`); the dialog reads `window.location.search` in a one-shot `useEffect` guarded by an `initRef` and strips it with `window.history.replaceState`. See `docs/adr/11-ux-consolidation-bug-fixes.md` and `docs/adr/12-route-race-stabilization.md`.
- **SearchContext** — bridges the `searchNodes` server action into `CommandPalette` without a cross-feature import. `dashboard/layout.tsx` passes `searchNodes` as a prop to `SearchProvider` (`shared/components/SearchContext.tsx`); `CommandPalette` consumes it via `useSearch()`. Do not add a second search surface — `SearchDialog` was permanently deleted in ADR 11.
- **Exports** — named only outside route files. No `export default` on components.
- **CSS** — mobile-first base styles, progressive `md:`/`lg:` overrides. Never `max-*:` breakpoints.
- **`cn`** — import from `@memory-palace/ui`, not from anywhere else.
- **Sentry** — `@sentry/nextjs` is integrated via `apps/web/src/instrumentation.ts` (loaded once per cold start). No-ops when `NEXT_PUBLIC_SENTRY_DSN` is absent, so local dev without `.env.local` is safe.
- **Practice / SR engine** — SM-2 reducer in `features/practice/lib/srs.ts` is **pure** (caller passes `now`); never call `Date.now()` inside the reducer. The legacy fixed `[1,3,7,14,30,60,120]` interval ladder is permanently discarded. `node_review_state` is **lazy-initialised** (no row until first practice) — `getDueNodes` LEFT JOINs and treats `nodeId IS NULL` as due. Distractors for multiple-choice come from a self-contained `getQuestionContext` action inside the practice feature — do **not** import `getRoomNodes` from the `nodes` feature (forbidden cross-feature import). `StreakCounter` lives in `features/practice/components/`, not in `features/dashboard/`, for the same reason. See `docs/adr/9a-practice-sr-engine.md`.
- **Toasts** — sonner is the **only** toast surface. Always import `toast` and `Toaster` from `@memory-palace/ui` (re-exports sonner) — never from `sonner` directly. The `<Toaster />` from `shared/components/Toaster.tsx` is mounted once in the **root** layout (`app/layout.tsx`), so all surfaces (marketing/auth/dashboard) can call `toast.*`.
- **Undo tokens** — destructive actions like `deletePalace` return `{ id, undoToken }` where `undoToken` is an HMAC-SHA256-signed payload `{ kind, id, userId, exp }` minted by `shared/lib/undoToken.ts` (30 s TTL). The paired `restorePalace` action verifies signature + kind + expiry + ownership, then clears `deleted_at`. Stateless — no extra schema. Set `UNDO_TOKEN_SECRET` in production; the dev fallback is intentional. See `docs/adr/9b-journey-stats-undo.md`.
- **Statistics panel** — `StatisticsPanel` lives in `features/practice/components/` (same boundary deviation as `StreakCounter`). The dashboard route mounts it via the thin RSC wrapper at `app/(dashboard)/dashboard/_components/StatisticsPanelSection.tsx`. The 7-day heatmap renders with raw Tailwind cells — **no** Recharts (or any other charting library) dependency.
- **Journey viewer** — `RoomJourney` (client) reads a sorted `JourneyNode[]` projection produced server-side at `app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/journey/page.tsx`. Walk order is `(positionY, positionX)` — top-to-bottom, left-to-right. Full-`100dvh` route. Uses framer-motion `m.article`; reduced-motion is honoured globally via `MotionConfig`.
- **Duplicate palace** — `duplicatePalace` runs in a single transaction: palace → rooms → nodes → re-attached `node_tags` by name (idempotent via `ON CONFLICT DO NOTHING`). Edges, review state, and practice sessions are **not** copied — they belong to graph identity / per-node history. Watch the Postgres parameter limit on very large palaces; chunked inserts are a future ADR.
- **Accent palette (marketing-only)** — `--gold`, `--emerald`, `--rose`, `--cyan`, `--amber` are opt-in semantic tokens (light + dark variants in `globals.css`, exposed as `bg-gold`/`from-emerald`/`text-rose/40` etc. via `@theme inline`). They may be used **only** inside `app/(marketing)/` and `features/marketing/`. An ESLint `no-restricted-syntax` rule in `apps/web/eslint.config.mjs` blocks `text-gold`/`bg-emerald`/`from-rose`/etc. outside those paths (the negative lookahead `(?!-)` lets product code keep using Tailwind's built-in numeric shades like `emerald-500`). Product surfaces use `primary`/`accent`/`success`/`warning`. See `docs/adr/9c-premium-theme.md`.
- **Marketing typography** — Space Grotesk is loaded once in the root layout and exposed as `--font-display`. The `(marketing)` route group sets `font-display` on its root container; use `font-display` for hero headings under `app/(marketing)/`. Loaded with `preload: false` since marketing isn't on the auth'd-user critical path.
- **Reveal animations** — use `<Reveal>` from `@/shared/components/Reveal` (paired with `useReveal` hook + `.reveal-up` CSS class in `globals.css`). IntersectionObserver-driven, fires once per element. Reduced-motion users see the final state immediately via a `prefers-reduced-motion` media query in CSS — do **not** add a `useReducedMotion()` JS check. `AmbientOrbs` (`app/(marketing)/_components/`) is a zero-JS decorative layer pinned `fixed inset-0 -z-10`; its keyframe is suppressed under reduced motion.
- **Full-viewport surfaces** — never use fixed pixel heights (`h-[500px]`, `h-[700px]`) on the canvas, journey, or any surface that should fill the viewport. Use `h-[calc(100dvh-{header}rem)]` (or plain `100dvh` when there's no chrome) so iOS Safari's URL-bar collapse doesn't strand the layout. Pair with `min-h-[420px]` or similar for split-screen safety. The room route in `app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/page.tsx` is the canonical example.
- **Canvas resize** — when the React Flow container can resize at runtime (rotation, sidebar toggle, URL-bar collapse), wire a `ResizeObserver` over the container to call `instance.fitView({ padding: 0.2, duration: 200, maxZoom: 1.5 })`. Debounce ≈ 120 ms and **always** guard with an `isDraggingRef` toggled in `onNodeDragStart` / `onNodeDragStop` / `onSelectionDragStop` — refitting mid-drag feels hostile. See `RoomCanvas.tsx` and ADR 13.
- **Swipe gestures** — framer-motion `drag` is the canonical swipe primitive via `useSwipeNavigation` in `shared/hooks/useSwipeNavigation.ts`. Do **not** introduce `react-swipeable` or `@use-gesture/react`. When pinning swipe handlers in a `useRef`, update `ref.current` **inside `useEffect`**, never during render — React 19's `react-hooks/refs` rule will flag it and strict mode can fire it twice.
- **Bible / Simple palace mode** — `palaces.mode` (`'bible' | 'simple'`, default `'bible'`) drives Bible-mode UI gating. Mode is fetched server-side and **threaded as a prop** from the route → `RoomCanvas`/`RoomJourney`/`NodeEditorSheet` (no client-side query → no flicker). Bible-mode-only fields (`nodes.verseHint`, `nodes.bibleRef`) persist on Simple-mode nodes too — switching modes is lossless, just hidden.
- **Room ordering** — `rooms.position` is canonical. `rooms.prev_room_id` / `rooms.next_room_id` are auxiliary linked-list pointers (nullable self-FK ON DELETE SET NULL) for chapter-traversal UI; they're not a replacement. `setRoomOrder` (`features/rooms/actions/setRoomOrder.ts`) writes `position` from an `orderedIds` array via a single `CASE` expression; validation rejects partial coverage. UI is `RoomReorderControls` (`↑/↓` chevrons). Linked-list pointers stay null until a journey-UI consumer requires them. See ADR 14.
- **`duplicateRoom`** — single transaction in `features/rooms/actions/duplicateRoom.ts`. Shifts sibling positions, copies nodes (including verse fields), re-attaches tags by name (`ON CONFLICT DO NOTHING`), copies **intra-room** edges only. Skips review state, practice sessions, and `prev_room_id`/`next_room_id` (per ADR 9B / ADR 13 convention — review history is per-node identity; chapter linking is user intent). UI is `DuplicateRoomButton` on `RoomCard`.
- **Feature complete = action AND UI surface.** A barrel-exported server action without a render path is unfinished work, not shipped. Plan retrospectives must verify both halves before claiming a symptom resolved. See ADR 14.
- **`MobileActionToolbar` / `MobileCreateFab`** — shared FAB primitives in `shared/components/`. Use on list pages for the primary "create" action; never duplicate the FAB pattern inside `features/`. `MobileCreateFab` composes `useAppDialog().open(dialogId)`. `bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]` clears the dashboard bottom nav.
- **`FlashcardDeck`** — Anki-style standalone deck on `/games/flashcards`, in `features/practice/components/`. Tap/Space flips; swipe or arrows navigate; **Again/Hard/Good/Easy** maps to SM-2 quality 0/3/4/5 via `recordPractice`. `DueNodeWithMeta` carries `verseHint`, `bibleRef`, and `palaceMode` so Bible-mode hints render without extra fetches. The flashcard mode inside `QuizSession` is the legacy in-quiz form; `FlashcardDeck` is the canonical standalone deck. See ADR 14.

## Commands

```bash
pnpm turbo dev                # Dev server at :3000
pnpm turbo build              # Build all
pnpm turbo lint               # ESLint
pnpm turbo typecheck          # TS strict
pnpm format                   # Prettier auto-fix
pnpm format:check             # Check formatting (CI)
pnpm check:guardrails         # Validate proxy.ts/middleware.ts rule
pnpm check:vercel-config      # Validate vercel.json
pnpm --filter @memory-palace/db generate   # New migration (after schema exists)
pnpm --filter @memory-palace/db push       # Push schema
pnpm --filter @memory-palace/db studio     # Drizzle Studio GUI
pnpm exec playwright test     # E2E headless
npx supabase start            # Local Supabase (needs Docker)
```

## Database (implemented)

Pooled Supavisor connection only (port 6543). 7 tables: `users`, `palaces`, `rooms`, `nodes`, `edges`, `tags`, `node_tags`. RLS on every table; node access chains `room → palace → user_id`. Soft deletes via `deleted_at`. Cursor pagination (`created_at` + `id`). GIN index (`idx_nodes_fts`) on nodes for full-text search — confirmed live on Supabase. Two-phase migrations for destructive changes.

## Testing

Four layers when applicable: Vitest unit, Vitest+RTL component, integration (server actions + real DB), Playwright E2E. Canvas drag-drop requires Playwright — JSDOM can't simulate React Flow pointer events. Playwright specs: `playwright/tests/auth.spec.ts`, `playwright/tests/dashboard-layout.spec.ts`. CI gate today: lint + typecheck + format + build + guardrails. Coverage thresholds in `vitest.config.ts` are aspirational.

## Code style

- TypeScript required on all new files; annotate explicit return types on all exported functions and components.
- Use Tailwind utility classes — never inline `style={{}}` props.
- Naming: `camelCase` for variables/functions, `PascalCase` for components and types, `kebab-case` for file names.
- Comments explain _why_, not _what_ — if the reason isn't important, skip the comment.
- Reduce nesting: prefer early returns and guard clauses over deeply nested conditionals.
- American English spelling throughout ("color", "initialize").

## Commits

Format: `<type>(<scope>): <description>` — description lowercase, no trailing period, first line ≤ 72 characters. Squash merge to `main` only. Batch local commits and push once when the task is complete — pushing prematurely triggers CI on intermediate states.

**Types:** `feat` (new feature or functionality), `fix` (bug fix), `chore` (docs, tests, config, CI), `refactor`, `docs`. Scope is optional but encouraged when the change targets a specific feature area.

**Scope examples:** `canvas`, `auth`, `db`, `nodes`, `palaces`, `rooms`, `settings`, `ui`.

Examples:

- `feat(canvas): add snap-to-grid toggle`
- `fix(auth): handle expired session cookie`
- `chore(db): add migration for node tags index`
- `refactor(palaces): extract pagination into shared hook`

## Skills

This project ships agent skills under `.agents/skills/`. Load the relevant skill **before** writing or reviewing code in these areas — do not attempt the work without reading the skill first.

**Always load:**

- `postgres-drizzle` — any schema change, migration, or Drizzle query
- `supabase` / `supabase-nextjs` — any auth, RLS policy, or Realtime subscription change
- `react-flow` / `react-flow-advanced` — canvas nodes, edges, handles, or viewport logic
- `zustand-state` — `canvasStore` or `CanvasStoreProvider` changes

**Load when in the area:**

- `tanstack-query` — new queries or mutations, especially `useRoomNodeMutations`
- `framer-motion` — any animation, `MotionProvider`, or `PageTransition` change
- `vitest` — writing or updating Vitest unit/component tests
- `playwright-e2e-testing` — writing or updating Playwright E2E specs
- `shadcn-ui` — adding or modifying primitives in `@memory-palace/ui`
- `zod` — new Zod schemas in server actions or `env.ts`
- `typescript-magician` — complex generic types, utility types, or removing `any`

When automating a convention, prefer in order: ESLint rule → lint-staged hook → skill → AGENTS.md prose. Only fall back to documenting in AGENTS.md when linter enforcement isn't feasible.

## Agent workflow

For non-trivial tasks, follow this sequence:

1. **Research** — find existing patterns in the codebase before writing anything new. Load the relevant skill(s).
2. **Plan** — write a concise plan before touching files. If scope is unclear, ask clarifying questions upfront and group them rather than interrupting mid-task.
3. **Implement** — execute the plan. Go as far as possible; save any remaining questions for the end.
4. **Verify** — run tests or lint to confirm the change works before declaring done. Never mark a task complete without a feedback loop.

## Documentation hygiene

If a doc grows larger than the code it describes, trim it. Speculative future-phase decisions go in `docs/adr/<phase>-<topic>.md`, written when the phase begins. Don't expand `ARCHITECTURE.md` with tools the codebase doesn't import.
