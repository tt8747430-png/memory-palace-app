# AGENTS.md

## Project overview

Memory Palace App — a spatial learning platform where users create virtual "palaces" with rooms containing draggable memory nodes on a 2D canvas. **Phases 1, 2A, 2B, 2C, 3A, 3B, and 3C are complete.** See `ROADMAP.md` for what is next, `ARCHITECTURE.md` for current-state decisions, and `docs/archive/` for the older aspirational design documents — those are reference, not authoritative.

## Tech stack (in use today)

Next.js 16.2.4 (App Router) · React Compiler · Turborepo + pnpm · Supabase (Postgres + Auth) · Drizzle ORM (7-table schema live, RLS enabled on all tables) · Tailwind v4 + shadcn primitives in `@memory-palace/ui` · `next-themes` (dark/light/system toggle) · Zod (env + server-action validation) · Upstash Redis + `@upstash/ratelimit` (sliding-window rate limiting in server actions) · Vitest + Testing Library (108 tests) · Playwright (wired, no specs yet).

Tools listed in archived docs (Yjs/CRDT, Sentry, kbar, Recharts, framer-motion, R3F) are **not chosen yet**. Each will land via an ADR in `docs/adr/`.

## Architecture essentials

- **Monorepo:** `apps/web/` (Next.js), `packages/db/` (Drizzle), `packages/ui/` (primitives + `cn`), `packages/eslint-config`, `packages/typescript-config`. Workspaces export TS source directly; nothing is pre-built.
- **Routing middleware:** Next.js 16 uses `src/proxy.ts` — a CI guardrail fails the build if `middleware.ts` reappears.
- **Auth enforcement:** the proxy redirects unauthenticated traffic before any layout renders; RLS is the database-side guard. Layouts must not add a per-navigation `auth()` round-trip.
- **Supabase clients:** only via `apps/web/src/shared/lib/supabase.ts` (`createSupabaseFromCookies`, `createSupabaseForResponse`, `createSupabaseForProxy`, `auth`). No browser-side Supabase client today; auth is fully cookie-based via server actions. Never re-implement the cookie boilerplate.
- **Env vars:** only via `apps/web/src/shared/lib/env.ts`. Never `process.env.X!` at call sites.
- **DB client:** `import { getDb } from '@memory-palace/db'` — the client is lazy; importing the package does not require `DATABASE_URL`. **All Drizzle query helpers (`eq`, `and`, `sql`, `desc`, etc.) must be imported from `@memory-palace/db`, not from `drizzle-orm` directly** — this avoids a pnpm dual-resolution type conflict caused by `@upstash/redis` declaring an optional `drizzle-orm` peer dependency.
- **Feature dirs:** `apps/web/src/features/<domain>/` directories are created **only when work starts**. Today: `auth/`, `dashboard/`, `palaces/`, `nodes/`. `eslint-plugin-boundaries` forbids cross-feature imports; cross-cutting code goes to `src/shared/`.

## Key conventions

- Components export by name (no `export default` outside route files).
- `cn` is imported from `@memory-palace/ui`.
- Mobile-first CSS: base styles for mobile, `md:` / `lg:` for progressive override. Never `max-*:` breakpoints.
- **Server Actions:** Zod validate input → `checkRateLimit(userId, 'write' | 'search')` → Drizzle query. Return `ActionResponse<T> = { success, data } | { success, error: { code, message } }`. Place under `src/features/<domain>/actions/`. Verb-noun camelCase. See `features/auth/actions/` for the React-19 form pattern and `features/palaces/actions/` for the full server-action pattern.

## Commands

```bash
pnpm turbo dev                # Dev server :3000
pnpm turbo build              # Build all
pnpm turbo lint               # ESLint
pnpm turbo typecheck          # tsc --noEmit
pnpm turbo test:unit          # Vitest (108 tests)
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
