# AGENTS.md

## Project overview

Memory Palace App — a spatial learning platform where users create virtual "palaces" with rooms containing draggable memory nodes on a 2D canvas. **Phases 1, 2A, 2B, 2C, 3A, 3B, 3C, 4, 4C.3, 5A, 5B, 5C, 5D, 6, 7, and a post-6/7 refactor (ADR 8) are complete.** See `ROADMAP.md` for what is next, `ARCHITECTURE.md` for current-state decisions, and `docs/archive/` for the older aspirational design documents — those are reference, not authoritative.

## Tech stack (in use today)

Next.js 16.2.4 (App Router) · React Compiler · Turborepo + pnpm · Supabase (Postgres + Auth + Realtime) · Drizzle ORM (7-table schema live, RLS enabled on all tables) · Tailwind v4 + shadcn primitives in `@memory-palace/ui` · `next-themes` (dark/light/system toggle) · Zod (env + server-action validation) · Upstash Redis + `@upstash/ratelimit` (sliding-window rate limiting in server actions) · **Zustand v5** (canvas UI state, factory + Context pattern) · **TanStack Query v5** (server data, optimistic updates, cross-tab sync) · **@xyflow/react v12** (React Flow canvas) · **framer-motion v12** (`LazyMotion + domAnimation`; `m` components; `MotionProvider` at root) · `canvas-confetti` (dynamic import, Phase 8+ ready) · `react-hotkeys-hook` (installed, global shortcuts use custom prefix-key state machine) · `use-debounce` (500 ms coalesced patch in `NodeEditorSheet`) · Vitest + Testing Library (211 tests) · Playwright (`auth.spec.ts`, `dashboard-layout.spec.ts`).

Tools listed in archived docs (Yjs/CRDT, Sentry, Recharts, R3F) are **not chosen yet**. Each will land via an ADR in `docs/adr/`. `kbar` was explicitly rejected in ADR 6 (replaced by `cmdk`).

## Architecture essentials

- **Monorepo:** `apps/web/` (Next.js), `packages/db/` (Drizzle), `packages/ui/` (primitives + `cn`), `packages/eslint-config`, `packages/typescript-config`. Workspaces export TS source directly; nothing is pre-built.
- **Routing middleware:** Next.js 16 uses `src/proxy.ts` — a CI guardrail fails the build if `middleware.ts` reappears.
- **Auth enforcement:** the proxy redirects unauthenticated traffic before any layout renders; RLS is the database-side guard. Layouts must not add a per-navigation `auth()` round-trip.
- **Supabase clients:** only via `apps/web/src/shared/lib/supabase.ts` (`createSupabaseFromCookies`, `createSupabaseForResponse`, `createSupabaseForProxy`, `auth`). Auth is fully cookie-based via server actions. Never re-implement the cookie boilerplate.
- **Env vars:** only via `apps/web/src/shared/lib/env.ts`. Never `process.env.X!` at call sites.
- **DB client:** `import { getDb } from '@memory-palace/db'` — the client is lazy; importing the package does not require `DATABASE_URL`. **All Drizzle query helpers (`eq`, `and`, `sql`, `desc`, etc.) must be imported from `@memory-palace/db`, not from `drizzle-orm` directly** — this avoids a pnpm dual-resolution type conflict caused by `@upstash/redis` declaring an optional `drizzle-orm` peer dependency.
- **Feature dirs:** `apps/web/src/features/<domain>/` directories are created **only when work starts**. Today: `auth/`, `dashboard/`, `palaces/`, `nodes/`, `rooms/`, `settings/`, `spatial-canvas/`. `eslint-plugin-boundaries` forbids cross-feature imports; cross-cutting code goes to `src/shared/`.
- **Canvas state (Zustand):** `spatial-canvas/store/canvasStore.ts` defines `createCanvasStore`. Never instantiate it at module scope — use `CanvasStoreProvider` (per-mount factory via `useState`). Consume slices via `useCanvasStore(selector)` (reactive) or `useCanvasStoreApi().getState()` (imperative in event handlers). Both hooks are in `spatial-canvas/store/CanvasStoreContext.tsx`.
- **Server data (TanStack Query):** `QueryProvider` (`shared/components/QueryProvider.tsx`) wraps the app. Default `staleTime: 30_000`. Query key factory: `roomNodesQueryKey(roomId)` → `['rooms', roomId, 'nodes']`. Mutations follow the optimistic protocol in `useRoomNodeMutations`: cancelQueries → snapshot → setQueryData → onError rollback → onSettled invalidateQueries.
- **Realtime sync (two layers):** Layer 1 — `broadcastInvalidate` via `BroadcastChannel` (`shared/lib/cross-tab-sync.ts`) for same-device multi-tab. Layer 2 — `useRealtimeNodes(roomId)` subscribes to Supabase Postgres Changes for cross-device sync; invalidates the TanStack Query cache on any `nodes` change. See `docs/adr/5c-realtime-sync.md` (not yet in `docs/adr/` — referenced in code comments).
- **Supabase browser client:** `createSupabaseBrowser()` in `shared/lib/supabase-browser.ts` — a singleton used **only** for Realtime subscriptions. All data mutations still go through Server Actions (SSR client). Stored on `globalThis` to survive HMR re-execution.

## Key conventions

- Components export by name (no `export default` outside route files).
- `cn` is imported from `@memory-palace/ui`.
- Mobile-first CSS: base styles for mobile, `md:` / `lg:` for progressive override. Never `max-*:` breakpoints.
- **Server Actions:** Zod validate input → `checkRateLimit(userId, 'write' | 'search')` → Drizzle query. Return `ActionResponse<T> = { success, data } | { success, error: { code, message } }`. Place under `src/features/<domain>/actions/`. Verb-noun camelCase. See `features/auth/actions/` for the React-19 form pattern, `features/palaces/actions/` for the full server-action + rate-limit pattern, and `features/nodes/actions/` for cursor-paginated FTS queries.
- **framer-motion:** Use `m` (not `motion`) at call sites — requires `MotionProvider` (`LazyMotion + domAnimation`) to be an ancestor. `MotionProvider` is mounted in the root layout. For reduced-motion: `useReducedMotion()` + set `transition.duration` to `0`. Node exit animations use the `isExiting` state pattern (not `AnimatePresence` at canvas level — incompatible with React Flow's node lifecycle). See `docs/adr/7-animations-polish.md`.
- **Route constants:** `shared/lib/routes.ts` exports `PALACE_PAGE_RE` and `ROOM_ROUTE_RE`. Import from there; never re-declare locally.

## Commands

```bash
pnpm turbo dev                # Dev server :3000
pnpm turbo build              # Build all
pnpm turbo lint               # ESLint
pnpm turbo typecheck          # tsc --noEmit
pnpm turbo test:unit          # Vitest (211 tests)
pnpm format                   # Prettier write
pnpm format:check             # Prettier check (CI)
pnpm check:guardrails         # proxy.ts vs middleware.ts rule
pnpm check:vercel-config      # vercel.json validation
pnpm exec playwright test     # E2E
npx supabase start            # Local Supabase (Docker)
pnpm --filter @memory-palace/db generate   # New migration
pnpm --filter @memory-palace/db push       # Push schema to local DB
pnpm --filter @memory-palace/db studio     # Drizzle Studio GUI
```

## Documentation hygiene

If a doc is bigger than the code it describes, trim it. Speculative future-phase decisions go in `docs/adr/<phase>-<topic>.md`, written when the phase begins. Do not expand `ARCHITECTURE.md` with tools the codebase doesn't import.
