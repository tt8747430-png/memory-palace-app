# AGENTS.md

## Project Overview

Memory Palace App — a spatial learning platform using virtual "palaces" with rooms containing draggable memory nodes on a 2D canvas. **Source code is not yet implemented**; the repo currently contains design docs and a phased roadmap. Implementation starts from Phase 1 of `ROADMAP.md`.

## Tech Stack

Next.js (App Router) · Turborepo (pnpm) · Supabase (PostgreSQL + Auth + Realtime) · Drizzle ORM · React Flow (canvas) · Zustand (drag state) · TanStack Query (server state) · Yjs (CRDT sync) · Tailwind CSS + shadcn/ui · Playwright (E2E) · Vitest (unit/component)

## Architecture Essentials

- **Monorepo layout**: `apps/web/` (Next.js), `packages/db/` (Drizzle schema + migrations), `packages/ui/` (shadcn components), `packages/eslint-config/`, `packages/typescript-config/`
- **Feature-Sliced Design**: features live under `apps/web/src/features/{spatial-canvas,memory-nodes,search,auth,dashboard,3d-room}/`. `3d-room/` is a future React Three Fiber feature (post-v1.5.0). Cross-feature code goes in `apps/web/src/shared/`
- **State separation is strict**: canvas coordinates → Zustand (never TanStack Query); server data → TanStack Query (never Zustand); UI state → React `useState`
- **Data flow**: Drag@60fps via Zustand → batch save on drop via Server Action → Drizzle (pooled Supavisor) → Supabase Realtime → Yjs CRDT merge. Offline writes persist in y-indexeddb

## Key Conventions

- **Named exports only** — no `export default` on components
- **Server Actions must follow**: (1) Zod validate → (2) `checkRateLimit()` → (3) Drizzle DB call. No exceptions. See `CONTRIBUTING.md §8`
- **Server Action naming**: `[verb][Entity]` camelCase (e.g., `createPalace`, `batchUpdateNodes`), placed in `src/features/<domain>/actions/`
- **Return type**: All Server Actions return `ActionResponse<T>` discriminated union (`{ success, data }` | `{ success, error: { code, message } }`)
- **Feature isolation**: Never import between feature dirs. Use `src/shared/` for cross-feature code. Enforced by `eslint-plugin-boundaries`
- **Mobile-first CSS**: Write base styles for mobile, add `md:`, `lg:` overrides. Never write desktop-first with `max-*:` breakpoints
- **Conventional Commits**: `feat(canvas): ...`, `fix(auth): ...`, `chore(db): ...` — see `DEVELOPMENT.md §4`

## Commands

```bash
pnpm turbo dev              # Start all apps (http://localhost:3000)
pnpm turbo build            # Build all apps + packages
pnpm turbo lint             # ESLint across all packages
pnpm turbo typecheck        # TypeScript strict check
pnpm turbo format           # Prettier auto-fix
pnpm turbo format:check     # Check Prettier formatting (no auto-fix)

# Database (Drizzle)
pnpm --filter @memory-palace/db drizzle-kit generate   # Generate migration from schema
pnpm --filter @memory-palace/db drizzle-kit push       # Push schema to local DB
pnpm --filter @memory-palace/db drizzle-kit studio     # Open Drizzle Studio GUI
pnpm --filter @memory-palace/db seed                   # Seed dev data

# Testing
pnpm exec playwright test        # E2E headless
pnpm exec playwright test --ui   # E2E interactive

# Local Supabase (requires Docker)
npx supabase start    # Starts local Supabase (API + DB + Studio at :54323)
npx supabase stop
npx supabase db reset  # Drops all local data
```

## Database Rules

- **Always use pooled connection** (Supavisor, port 6543) in serverless — never direct connection. See `ARCHITECTURE.md §5.A`
- **RLS on all tables** — node access chains through `room → palace → user_id`
- **Indexes from Day 1** on every FK + GIN index on `nodes` for full-text search
- **Two-phase migrations** for destructive changes: Phase 1 adds new column + backfills; Phase 2 (next release) drops old column
- **Soft deletes**: palaces/rooms/nodes use `deleted_at` column, never hard-delete
- **Cursor-based pagination**: composite cursor (`created_at` + `id`), 20 items default, descending

## Testing Approach

- 4-layer pyramid: Unit (Vitest) → Component (Vitest + RTL) → Integration (Server Actions + real DB) → E2E (Playwright)
- Canvas drag-and-drop **must** be tested in Playwright — JSDOM cannot simulate React Flow pointer events
- CI quality gate (`ci.yml`): ESLint + Prettier + TypeScript strict + Drizzle migration check + Playwright E2E

## Key Files & Docs

| Path                 | Purpose                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `ARCHITECTURE.md`    | Single source of truth for all tech decisions, schema, file structure         |
| `UI_STYLE_GUIDE.md`  | Mobile-first design system, color palette, component patterns                 |
| `FEATURES.md`        | Feature specifications — dashboard, gamification, games, review, public pages |
| `ROADMAP.md`         | Step-by-step implementation guide with exact commands per phase               |
| `DEVELOPMENT.md`     | DevOps plan — branching, CI/CD pipelines, secrets, daily workflow             |
| `CONTRIBUTING.md §5` | Full command reference table                                                  |
| `CONTRIBUTING.md §8` | Code style rules with ✅/❌ examples                                          |
| `TESTING.md`         | 4-layer testing strategy with examples                                        |
| `SECURITY.md`        | CSP headers, RLS policies, rate limiting layers                               |
| `PERFORMANCE.md`     | Canvas virtualization, debounce strategy, bundle budgets                      |
| `cliff.toml`         | git-cliff config for changelog generation                                     |
