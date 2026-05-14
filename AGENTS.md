# CLAUDE.md — memory-palace-app

Next.js 16 + React 19 (React Compiler on) memory-palace SPA. Single-package Turborepo pnpm project , Supabase auth, Postgres via Drizzle, TanStack Query, Zustand, Framer Motion, React Flow.

## Repo layout

The repo is a single Next.js app rooted at `/`. Path alias `@/*`.

- `src/db/` (`@/db`) — Drizzle schema, relations, types, client, seed. Re-exports drizzle-orm operators via the barrel.
- `src/ui/` (`@/ui`) — shadcn-style primitives (Radix wrappers + `cn()`). App-specific components live under `src/shared/components` or feature folders.
- `src/features/<name>/` — domain code.
- `src/shared/{lib,components,hooks}/` — cross-feature shared code.
- `src/app/` — Next.js App Router routes.
- `drizzle.config.ts` (root) — drizzle-kit config; scripts in `package.json`: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`.
- `eslint.config.mjs` + `tsconfig.json` (root) own all lint/ts settings inline — no shared config packages.
- `.storybook/` (root) — Storybook setup; stories co-located in `src/**/*.stories.{ts,tsx}`.
- Tests: unit/integration co-located in `__tests__/` (vitest, jsdom); e2e in `playwright/tests` (run against a built `next start`).

## Feature-folder convention (strict)

Every domain under `src/features/<name>/` follows this shape — match it when adding code:

```
features/palaces/
  actions/       # one server action per file, named export matching the file
  schemas/       # Zod schemas + inferred input types
  components/    # client components ("use client" at top)
  __tests__/
  index.ts       # barrel — re-export actions, schemas, components used by app/
```

App routes in `src/app/(dashboard|auth)/**` import only from feature `index.ts` barrels, never deep paths. Cross-feature shared code goes under `src/shared/{lib,components,hooks}`.

## Server actions — always use `defineAction`

Do not write bare `'use server'` functions. Use `defineAction` from `@/shared/lib/action` ([src/shared/lib/action.ts](src/shared/lib/action.ts)) which handles auth, Zod validation, Upstash rate limiting, and `ActionResponse<T>` shape (`{ success, data | error: { code, message } }`). Throw `ActionError(code, msg)` inside the handler for typed failures. Example: [src/features/palaces/actions/createPalace.ts](src/features/palaces/actions/createPalace.ts).

After mutating, call `revalidatePath()` for affected routes inside the handler.

## Database

Use `getDb()` from `@/db` and import operators (`eq`, `and`, `desc`, `sql`, …) from the same barrel — `@/db` re-exports drizzle-orm. Schema lives at [src/db/schema.ts](src/db/schema.ts) and relations at [src/db/relations.ts](src/db/relations.ts). Drizzle-kit scripts (`pnpm db:generate | db:push | db:migrate | db:studio | db:seed`) read [drizzle.config.ts](drizzle.config.ts). Generated migrations land in `drizzle/`.

## Auth & middleware

Next.js 16 uses `src/proxy.ts`. The proxy handles Supabase session refresh, route gating (see `PUBLIC_SEGMENTS` — currently `login`, `signup`, `callback`, `forgot-password`), and injects the CSP from `@/shared/lib/csp`. Unauthenticated `/` is redirected to `/login`; there is no public landing page.

`/signup` is the single signup entry and hosts the full `OnboardingWizard` (5 steps: create account → name palace → choose theme → add node → complete). Authenticated users hitting `/signup` are redirected to `/dashboard` unless `?step=2..5` is set (so the email-verification round-trip can resume the wizard).

`AuthShell` (split-screen auth layout with cinematic background, used by `/login`, `/signup`, `/forgot-password`, `/update-password`) lives in `@/features/auth` along with `CinematicBackground` and `Starfield`.

Server-side Supabase: `createSupabaseForProxy` / `getCurrentUser` in `@/shared/lib/supabase`. Browser client: `@/shared/lib/supabase-browser`.

## UI patterns specific to this repo

- Dialogs are mounted globally via `AppDialogContext` (see [src/shared/components/AppDialogContext.tsx](src/shared/components/AppDialogContext.tsx)). Never call `openDialog()` from a global shortcut before the target dialog is on screen — branch on `pathname` and encode intent via `?action=...` URL params.
- `PageTransition` is enter-only (no `AnimatePresence` — breaks App Router RSC). Reduced motion is global via `MotionProvider`; do not use `useReducedMotion()` locally.
- Every RSC route must have a `loading.tsx`.
- shadcn primitives live in `@/ui`; use `cn()` from there. Tailwind v4 (`@tailwindcss/postcss`), no `tailwind.config`. ESLint relaxes `jsx-a11y/heading-has-content`, `jsx-a11y/label-has-associated-control`, and `react-hooks/immutability` for `src/ui/**` because shadcn primitives wrap Radix and consumers supply the content/labels/ref composition.

## Room inspector

The room page (`/palaces/[id]/rooms/[id]`) stays full-bleed and now hosts `RoomInspector` on the right. State lives in `useRoomInspector` (`useSyncExternalStore` + `localStorage` keys `mp:room-inspector-open` / `mp:room-inspector-tab`, mirroring `useSidebarCollapsed`). The header toggle is `RoomInspectorToggle`. Desktop renders an inline `<aside class="lg:w-80">` that animates to `lg:w-0` when closed; mobile uses a `Sheet`. Activity data comes from `getRoomRecentActivity` and is formatted with the same `describeEvent` + `formatRelative` helpers used by the dashboard.

## Settings section layout

Settings is a sectioned tabs nav: `app/(dashboard)/settings/layout.tsx` renders `SettingsNav` (left rail `lg:`, horizontal scroll pills below) next to the active section route. The index `/settings` redirects to `/settings/profile`. Section routes: `profile`, `preferences`, `account`, `data`. Wrap each section's panels in `SettingsSection` (card with bordered header) for visual rhythm. New sections must:

1. Add a route under `app/(dashboard)/settings/<slug>/page.tsx`.
2. Add an entry to `SETTINGS_SECTIONS` in `features/settings/components/SettingsNav.tsx`.
3. Server actions go through `defineAction` and call `revalidatePath('/settings/<slug>')`.

## Commands

```bash
pnpm dev                          # next dev
pnpm build                        # next build
pnpm test:unit                    # vitest run
pnpm test:unit -- <pattern>       # vitest with filter
pnpm check:prepush                # guardrails + lint + format:check + build (run before pushing)
pnpm exec playwright test         # builds then runs e2e
pnpm db:seed                      # seed dev data
pnpm db:push                      # apply schema to DB
```

Node ≥22, pnpm ≥9. Git hooks are auto-installed via `prepare` → `scripts/setup-git-hooks.sh`.

## Don't

- Don't import from `drizzle-orm` directly in app code — go through `@/db` (it re-exports operators alongside the schema).
- Don't bypass `defineAction` for server mutations (loses auth + rate limit + error envelope).
- Don't deep-import into `features/*/`; use the barrel.
