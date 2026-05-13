# AGENTS.md — memory-palace-app

Next.js 16 + React 19 (React Compiler on) memory-palace SPA. Turborepo + pnpm workspace, Supabase auth, Postgres via Drizzle, TanStack Query, Zustand, Framer Motion, React Flow.

## Workspace layout

- `apps/web` — the only app. Path alias `@/*` → `apps/web/src/*`.
- `packages/db` (`@memory-palace/db`) — Drizzle schema, client, seed, raw `migrations/*.sql` applied via `scripts/apply-migration.mjs`.
- `packages/ui` (`@memory-palace/ui`) — shadcn-style primitives only. App-specific components live under `apps/web/src/shared/components` or feature folders.
- `packages/eslint-config`, `packages/typescript-config` — shared configs (extend `@memory-palace/typescript-config/nextjs.json`).
- Tests: unit/integration co-located in `__tests__/` (vitest, jsdom); e2e in `playwright/tests` (run against a built `next start`).

## Feature-folder convention (strict)

Every domain under `apps/web/src/features/<name>/` follows this shape — match it when adding code:

```
features/palaces/
  actions/       # one server action per file, named export matching the file
  schemas/       # Zod schemas + inferred input types
  components/    # client components ("use client" at top)
  __tests__/
  index.ts       # barrel — re-export actions, schemas, components used by app/
```

App routes in `apps/web/src/app/(dashboard|auth|marketing)/**` import only from feature `index.ts` barrels, never deep paths. Cross-feature shared code goes under `apps/web/src/shared/{lib,components,hooks}`.

## Server actions — always use `defineAction`

Do not write bare `'use server'` functions. Use `defineAction` from `@/shared/lib/action` ([apps/web/src/shared/lib/action.ts](apps/web/src/shared/lib/action.ts)) which handles auth, Zod validation, Upstash rate limiting, and `ActionResponse<T>` shape (`{ success, data | error: { code, message } }`). Throw `ActionError(code, msg)` inside the handler for typed failures. Example: [apps/web/src/features/palaces/actions/createPalace.ts](apps/web/src/features/palaces/actions/createPalace.ts).

After mutating, call `revalidatePath()` for affected routes inside the handler.

## Database

Use `getDb()` from `@memory-palace/db` and import operators (`eq`, `and`, `desc`, `sql`, …) from the same package — it re-exports drizzle-orm. SQL migrations are hand-written under `packages/db/migrations/` and applied with `pnpm --filter @memory-palace/db tsx scripts/apply-migration.mjs <file>`. `drizzle-kit generate`/`push` exist but the source of truth is the raw SQL files plus `apply-rls.mjs` for RLS.

## Auth & middleware

There is no `middleware.ts`. Next.js 16 uses `apps/web/src/proxy.ts` (the `proxy` export). A CI guardrail (`scripts/ci/check-guardrails.mjs`) fails the build if `middleware.ts` is ever added. The proxy handles Supabase session refresh, route gating (see `PUBLIC_SEGMENTS`), and injects the CSP from `@/shared/lib/csp`.

Server-side Supabase: `createSupabaseForProxy` / `getCurrentUser` in `@/shared/lib/supabase`. Browser client: `@/shared/lib/supabase-browser`.

## UI patterns specific to this repo

- Dialogs are mounted globally via `AppDialogContext` (see [apps/web/src/shared/components/AppDialogContext.tsx](apps/web/src/shared/components/AppDialogContext.tsx)). Never call `openDialog()` from a global shortcut before the target dialog is on screen — branch on `pathname` and encode intent via `?action=...` URL params (see `/memories/repo/global-shortcuts-dialog-pattern.md`).
- `PageTransition` is enter-only (no `AnimatePresence` — breaks App Router RSC). Reduced motion is global via `MotionProvider`; do not use `useReducedMotion()` locally.
- Every RSC route must have a `loading.tsx`.
- Full-bleed dashboard pages have a fixed height formula due to `DashboardShell`'s `py-6` wrapper — see `/memories/repo/dashboard-full-bleed-height.md` before writing one.
- shadcn primitives live in `@memory-palace/ui`; use `cn()` from there. Tailwind v4 (`@tailwindcss/postcss`), no `tailwind.config`.

## Commands

```bash
pnpm dev                          # turbo dev (all packages)
pnpm --filter @memory-palace/web dev
pnpm test:unit                    # vitest across workspace
pnpm --filter @memory-palace/web test:unit -- <pattern>
pnpm check:prepush                # guardrails + lint + format:check + build (run before pushing)
pnpm exec playwright test         # builds web then runs e2e
pnpm --filter @memory-palace/db seed
```

Node ≥22, pnpm ≥9. Git hooks are auto-installed via `prepare` → `scripts/setup-git-hooks.sh`.

## Don't

- Don't add `middleware.ts` (guardrail fails). Edit `proxy.ts`.
- Don't import from `drizzle-orm` directly in app code — go through `@memory-palace/db`.
- Don't bypass `defineAction` for server mutations (loses auth + rate limit + error envelope).
- Don't deep-import into `features/*/`; use the barrel.
