# CLAUDE.md

## What this is

Spatial learning app: drag memory nodes on a 2D canvas. Read `ARCHITECTURE.md` for current-state decisions. `ROADMAP.md` lists what is built and what is next. Anything in `docs/archive/` is **aspirational, not authoritative** — do not infer that a tool listed there is installed.

**Current status:** Phases 1, 2A/2B/2C, 3A–3C, 4, 4C.3, 5A, 5B, 5C, 5D, 6, 7, a post-6/7 refactor (ADR 8), ADR 11 (UX consolidation + ghost-dialog fix), and ADR 12 (route-race fix + loading skeletons) are complete. Zustand v5, TanStack Query v5, @xyflow/react v12, framer-motion v12, `cmdk`, and `@sentry/nextjs` are all in use. Yjs/CRDT and `kbar` are explicitly not chosen.

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

## Documentation hygiene

If a doc grows larger than the code it describes, trim it. Speculative future-phase decisions go in `docs/adr/<phase>-<topic>.md`, written when the phase begins. Don't expand `ARCHITECTURE.md` with tools the codebase doesn't import.
