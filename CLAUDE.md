# CLAUDE.md

## What this is

Spatial learning app: drag memory nodes on a 2D canvas. Read `ARCHITECTURE.md` for current-state decisions. `ROADMAP.md` lists what is built and what is next. Anything in `docs/archive/` is **aspirational, not authoritative** — do not infer that a tool listed there is installed.

**Current status (2026-05-05):** Phase 1 + Phase 2 complete (2A layout shell, 2B theme system, 2C base components). Schema, RLS, server actions, canvas — all not started.

## Monorepo

Turborepo + pnpm workspaces. `apps/web/` (Next.js 16.2.4 App Router), `packages/db/` (Drizzle, schema empty until Phase 3), `packages/ui/` (shadcn primitives + `cn`), `packages/eslint-config`, `packages/typescript-config`.

Feature dirs in `apps/web/src/features/<domain>/` are created **only when work starts**. `auth/` and `dashboard/` exist today. Cross-feature imports are forbidden by `eslint-plugin-boundaries`; cross-cutting code goes to `src/shared/`.

**Routing middleware:** Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. A CI guardrail (`scripts/ci/check-guardrails.mjs`) enforces this.

## Critical patterns

- **Supabase clients** — only via `apps/web/src/shared/lib/supabase.ts` (`createSupabaseFromCookies`, `createSupabaseForResponse`, `createSupabaseForProxy`, `auth`). No browser-side Supabase client today; auth is fully cookie-based via server actions. Never re-implement the cookie `getAll`/`setAll` boilerplate.
- **Env vars** — only via `apps/web/src/shared/lib/env.ts`. Never `process.env.X!` at call sites.
- **Auth enforcement** — proxy + RLS only. Don't add a per-navigation `auth()` round-trip in layouts.
- **DB client** — `import { getDb } from '@memory-palace/db'`. Call once at the top of an action; importing the package does not require `DATABASE_URL`.
- **Server Actions** — Zod validate input → rate-limit (TBD ADR) → Drizzle query. Return either a discriminated union state for `useActionState` flows, or `ActionResponse<T> = { success, data } | { success, error: { code, message } }` for direct callers. Place under `src/features/<domain>/actions/`. Verb-noun camelCase. See `features/auth/actions/` for the React-19 form pattern.
- **State separation** — canvas XY in Zustand (60fps drag, save on drop); server data in TanStack Query; UI toggles in `useState`. None of this is wired yet — choose the libraries via ADR before introducing them.
- **Exports** — named only outside route files. No `export default` on components.
- **CSS** — mobile-first base styles, progressive `md:`/`lg:` overrides. Never `max-*:` breakpoints.
- **`cn`** — import from `@memory-palace/ui`, not from anywhere else.

## Commands

```bash
pnpm turbo dev                # Dev server at :3000
pnpm turbo build              # Build all
pnpm turbo lint               # ESLint
pnpm turbo typecheck          # TS strict
pnpm turbo format             # Prettier auto-fix
pnpm turbo format:check       # Check formatting (CI)
pnpm check:guardrails         # Validate proxy.ts/middleware.ts rule
pnpm check:vercel-config      # Validate vercel.json
pnpm --filter @memory-palace/db generate   # New migration (after schema exists)
pnpm --filter @memory-palace/db push       # Push schema
pnpm --filter @memory-palace/db studio     # Drizzle Studio GUI
pnpm exec playwright test     # E2E headless
npx supabase start            # Local Supabase (needs Docker)
```

## Database (target — not yet implemented)

Pooled Supavisor connection only (port 6543). RLS on every table; node access chains `room → palace → user_id`. Soft deletes via `deleted_at`. Cursor pagination (`created_at` + `id`). Two-phase migrations for destructive changes. Index every FK + GIN on nodes for full-text search.

## Testing

Four layers when applicable: Vitest unit, Vitest+RTL component, integration (server actions + real DB), Playwright E2E. Canvas drag-drop requires Playwright — JSDOM can't simulate React Flow pointer events. CI gate today: lint + typecheck + format + build + guardrails. Coverage thresholds in `vitest.config.ts` are aspirational.

## Commits

Conventional: `feat(canvas):`, `fix(auth):`, `chore(db):`, `refactor(...)`, `docs(...)`. Squash merge to `main` only.

## Documentation hygiene

If a doc grows larger than the code it describes, trim it. Speculative future-phase decisions go in `docs/adr/<phase>-<topic>.md`, written when the phase begins. Don't expand `ARCHITECTURE.md` with tools the codebase doesn't import.
