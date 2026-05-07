# CLAUDE.md

## What this is

Spatial learning app: drag memory nodes on a 2D canvas. Read `ARCHITECTURE.md` for current-state decisions. `ROADMAP.md` lists what is built and what is next. Anything in `docs/archive/` is **aspirational, not authoritative** — do not infer that a tool listed there is installed.

**Current status:** Phases 1, 2A/2B/2C, 3A–3C, 4, 4C.3, 5A, 5B, 5C, 5D, 6, 7, and a post-6/7 refactor (ADR 8) are complete. Zustand v5, TanStack Query v5, @xyflow/react v12, framer-motion v12, and `cmdk` are all in use. Yjs/CRDT and `kbar` are explicitly not chosen.

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
- **framer-motion** — use `m` (not `motion`) at call sites; requires `MotionProvider` (`LazyMotion + domAnimation`) as an ancestor (mounted in root layout). For reduced-motion: `useReducedMotion()` + set `transition.duration` to `0`. Node exit animations use the `isExiting` state pattern — `AnimatePresence` at canvas level is incompatible with React Flow's node lifecycle. See `docs/adr/7-animations-polish.md`.
- **Route constants** — `shared/lib/routes.ts` exports `PALACE_PAGE_RE` and `ROOM_ROUTE_RE`. Import from there; never re-declare locally.
- **Exports** — named only outside route files. No `export default` on components.
- **CSS** — mobile-first base styles, progressive `md:`/`lg:` overrides. Never `max-*:` breakpoints.
- **`cn`** — import from `@memory-palace/ui`, not from anywhere else.

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

## Commits

Conventional: `feat(canvas):`, `fix(auth):`, `chore(db):`, `refactor(...)`, `docs(...)`. Squash merge to `main` only.

## Documentation hygiene

If a doc grows larger than the code it describes, trim it. Speculative future-phase decisions go in `docs/adr/<phase>-<topic>.md`, written when the phase begins. Don't expand `ARCHITECTURE.md` with tools the codebase doesn't import.
