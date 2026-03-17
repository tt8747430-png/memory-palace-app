# CLAUDE.md

## What This Is

Pre-implementation design repo for a spatial learning app (drag memory nodes on a 2D canvas). No source code exists yet — implementation follows `ROADMAP.md` phases sequentially. Read `ARCHITECTURE.md` before writing any code.

## Monorepo Structure

Turborepo + pnpm workspaces. `apps/web/` = Next.js App Router. `packages/db/` = Drizzle schema/migrations. `packages/ui/` = shadcn components. Features live in `apps/web/src/features/{spatial-canvas,memory-nodes,search,auth,dashboard}/`, shared code in `src/shared/`.

## Critical Patterns

**Server Actions** — every action must: (1) Zod validate, (2) `checkRateLimit()`, (3) Drizzle query. Name as `[verb][Entity]` camelCase. Return `ActionResponse<T>` (`{ success, data } | { success, error: { code, message } }`). Place in `src/features/<domain>/actions/`.

```typescript
// ✅ src/features/memory-nodes/actions/createNode.ts
'use server';
const parsed = Schema.parse(input); // 1. Zod
await checkRateLimit(); // 2. Rate limit
return db.insert(nodes).values(parsed); // 3. Drizzle
```

**State separation** — canvas XY → Zustand (60fps drag, save only on drop); server data → TanStack Query; UI toggles → `useState`. Never cross these boundaries.

**Feature isolation** — never import between feature dirs. Cross-feature code → `src/shared/`. Enforced by `eslint-plugin-boundaries`.

**Exports** — named only, no `export default` on components.

**CSS** — mobile-first base styles, progressive `md:`/`lg:` overrides. Never `max-*:` breakpoints.

## Commands

```bash
pnpm turbo dev                # Dev server at :3000
pnpm turbo build              # Build all
pnpm turbo lint               # ESLint
pnpm turbo typecheck          # TS strict
pnpm --filter @memory-palace/db drizzle-kit generate  # New migration
pnpm --filter @memory-palace/db drizzle-kit push      # Push schema
pnpm exec playwright test     # E2E
npx supabase start            # Local Supabase (needs Docker)
```

## Database

Pooled Supavisor connection only (port 6543) — never direct connect in serverless. RLS on every table; node access chains `room → palace → user_id`. Soft deletes via `deleted_at` column. Cursor pagination (`created_at` + `id`). Two-phase migrations for destructive schema changes. Index every FK + GIN on nodes for full-text search.

## Testing

4 layers: Unit (Vitest) → Component (Vitest+RTL) → Integration (Server Actions+real DB) → E2E (Playwright). Canvas drag-drop requires Playwright — JSDOM can't simulate React Flow pointer events. CI gate: lint + typecheck + migration check + Playwright.

## Commits

Conventional: `feat(canvas):`, `fix(auth):`, `chore(db):`. Squash merge to `main` only.
