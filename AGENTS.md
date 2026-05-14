# AGENTS.md — memory-palace-app

Next.js 16 + React 19 (React Compiler on) memory-palace SPA. Turborepo + pnpm workspace, Supabase auth, Postgres via Drizzle, TanStack Query, Zustand, Framer Motion, React Flow.

## Workspace layout

- `apps/web` — the only app. Path alias `@/*` → `apps/web/src/*`. No `packages/` workspace anymore; everything lives inside `apps/web/`.
- `apps/web/src/db/` (`@/db`) — Drizzle schema, relations, types, client, seed. Re-exports drizzle-orm operators via the barrel.
- `apps/web/src/ui/` (`@/ui`) — shadcn-style primitives (Radix wrappers + `cn()`). App-specific components live under `apps/web/src/shared/components` or feature folders.
- `apps/web/drizzle.config.ts` — drizzle-kit config; scripts at the app root: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`.
- `apps/web/eslint.config.mjs` + `apps/web/tsconfig.json` own all lint/ts settings inline — no shared config packages.
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

App routes in `apps/web/src/app/(dashboard|auth)/**` import only from feature `index.ts` barrels, never deep paths. Cross-feature shared code goes under `apps/web/src/shared/{lib,components,hooks}`. There is no marketing route group or `features/marketing` — unauthenticated `/` is redirected to `/login` by `proxy.ts`.

## Server actions — always use `defineAction`

Do not write bare `'use server'` functions. Use `defineAction` from `@/shared/lib/action` ([apps/web/src/shared/lib/action.ts](apps/web/src/shared/lib/action.ts)) which handles auth, Zod validation, Upstash rate limiting, and `ActionResponse<T>` shape (`{ success, data | error: { code, message } }`). Throw `ActionError(code, msg)` inside the handler for typed failures. Example: [apps/web/src/features/palaces/actions/createPalace.ts](apps/web/src/features/palaces/actions/createPalace.ts).

After mutating, call `revalidatePath()` for affected routes inside the handler.

## Database

Use `getDb()` from `@/db` and import operators (`eq`, `and`, `desc`, `sql`, …) from the same barrel — `@/db` re-exports drizzle-orm. Schema lives at [apps/web/src/db/schema.ts](apps/web/src/db/schema.ts) and relations at [apps/web/src/db/relations.ts](apps/web/src/db/relations.ts). Drizzle-kit scripts (`pnpm --filter @memory-palace/web db:generate | db:push | db:migrate | db:studio | db:seed`) read [apps/web/drizzle.config.ts](apps/web/drizzle.config.ts). Generated migrations land in `apps/web/drizzle/`.

## Auth & middleware

There is no `middleware.ts`. Next.js 16 uses `apps/web/src/proxy.ts` (the `proxy` export). A CI guardrail (`scripts/ci/check-guardrails.mjs`) fails the build if `middleware.ts` is ever added. The proxy handles Supabase session refresh, route gating (see `PUBLIC_SEGMENTS` — currently `login`, `signup`, `callback`, `forgot-password`), and injects the CSP from `@/shared/lib/csp`. Unauthenticated `/` is redirected to `/login`; there is no public landing page.

`/signup` is the single signup entry and hosts the full `OnboardingWizard` (5 steps: create account → name palace → choose theme → add node → complete). Authenticated users hitting `/signup` are redirected to `/dashboard` unless `?step=2..5` is set (so the email-verification round-trip can resume the wizard). The simple email/password `SignupForm` and `signUp` action no longer exist — onboarding owns signup.

`AuthShell` (split-screen auth layout with cinematic background, used by `/login`, `/forgot-password`, `/update-password`) lives in `@/features/auth` along with `CinematicBackground` and `Starfield`. The `/signup` page consumes `CinematicBackground` directly (no AuthShell — it uses the full-bleed wizard layout).

Server-side Supabase: `createSupabaseForProxy` / `getCurrentUser` in `@/shared/lib/supabase`. Browser client: `@/shared/lib/supabase-browser`.

## UI patterns specific to this repo

- Dialogs are mounted globally via `AppDialogContext` (see [apps/web/src/shared/components/AppDialogContext.tsx](apps/web/src/shared/components/AppDialogContext.tsx)). Never call `openDialog()` from a global shortcut before the target dialog is on screen — branch on `pathname` and encode intent via `?action=...` URL params (see `/memories/repo/global-shortcuts-dialog-pattern.md`).
- `PageTransition` is enter-only (no `AnimatePresence` — breaks App Router RSC). Reduced motion is global via `MotionProvider`; do not use `useReducedMotion()` locally.
- Every RSC route must have a `loading.tsx`.
- Full-bleed dashboard pages have a fixed height formula due to `DashboardShell`'s `py-6` wrapper — see `/memories/repo/dashboard-full-bleed-height.md` before writing one.
- shadcn primitives live in `@/ui`; use `cn()` from there. Tailwind v4 (`@tailwindcss/postcss`), no `tailwind.config`. ESLint relaxes `jsx-a11y/heading-has-content`, `jsx-a11y/label-has-associated-control`, and `react-hooks/immutability` for `src/ui/**` because shadcn primitives wrap Radix and consumers supply the content/labels/ref composition.

## Page layout vocabulary (Tailwind UI–style)

The dashboard, palace detail, and settings screens follow a consistent stat-row + main/aside grammar so adding a new screen has a clear template:

- **Header strip**: page title (`<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">`), one-line subtitle, right-aligned action buttons. On palace detail, a breadcrumb sits above the title.
- **KPI row** (dashboard only): `grid-cols-2 sm:grid-cols-4` of `KpiTile`s. Use it for at-a-glance totals; do not mix in CTAs.
- **Main + aside grid**: `grid gap-6 lg:grid-cols-3` with main spanning `lg:col-span-2` and a single `<aside class="space-y-6">` column. Stacks vertically below `lg:` automatically.
- **Panel**: `rounded-2xl border bg-card shadow-sm` with a sectioned header (`<header class="border-b px-5 py-3">` + `<h2 class="text-sm font-semibold tracking-tight">`). Lists inside use `divide-y`.
- **Activity feed**: `ActivityFeedPanel` from `@/features/dashboard` is the canonical timeline component. Shape items as `ActivityEvent` from `features/dashboard/activity.ts` (covers practice + node/room/palace creation). Use `describeEvent`, `formatRelative`, `eventIcon`, and `eventTone` from the same module — do not re-implement these formatters.

## Dashboard home composition

`app/(dashboard)/dashboard/page.tsx` does all cross-feature fetching (feature boundaries forbid `features/dashboard → features/practice`) and passes pure data into `DashboardOverview`. The presentational tree is: `DashboardHeader` → `DashboardKpiRow` → main column (`RecentPalacesPanel`, `ActivityFeedPanel`) + aside (`DuePracticeAside`, `StreakGoalAside`, `QuickLaunchAside`). Add new panels under `features/dashboard/components/` and re-export from the barrel.

## Palace detail composition

`PalaceDetailHeader` accepts a `primaryAction` slot so the page (not the feature) supplies cross-feature buttons like `CreateRoomDialog` — this respects the `features/palaces → features/rooms` boundary block. The right column is `PalaceMetaPanel` (definition list of counts, mastery %, dates). Per-palace activity uses `getPalaceRecentActivity` and renders through the shared `ActivityFeedPanel`.

## Room inspector

The room page (`/palaces/[id]/rooms/[id]`) stays full-bleed and now hosts `RoomInspector` on the right. State lives in `useRoomInspector` (`useSyncExternalStore` + `localStorage` keys `mp:room-inspector-open` / `mp:room-inspector-tab`, mirroring `useSidebarCollapsed`). The header toggle is `RoomInspectorToggle`. Desktop renders an inline `<aside class="lg:w-80">` that animates to `lg:w-0` when closed; mobile uses a `Sheet`. Activity data comes from `getRoomRecentActivity` and is formatted with the same `describeEvent` + `formatRelative` helpers used by the dashboard.

## Settings section layout

Settings is a sectioned tabs nav: `app/(dashboard)/settings/layout.tsx` renders `SettingsNav` (left rail `lg:`, horizontal scroll pills below) next to the active section route. The index `/settings` redirects to `/settings/profile`. Section routes: `profile`, `preferences`, `account`, `data`. Wrap each section's panels in `SettingsSection` (card with bordered header) for visual rhythm. New sections must:

1. Add a route under `app/(dashboard)/settings/<slug>/page.tsx`.
2. Add an entry to `SETTINGS_SECTIONS` in `features/settings/components/SettingsNav.tsx`.
3. Server actions go through `defineAction` and call `revalidatePath('/settings/<slug>')`.

## Dashboard shell (sidebar + bottom nav)

- Nav config is the single source of truth: `features/dashboard/nav.ts` exports `navItems` (4 tabs: Home/Palaces/Practice/Settings — drives mobile `BottomNav`), `sidebarGroups` (grouped desktop nav: Workspace, Learn), and `sidebarFooterItems`.
- Desktop `Sidebar` supports a collapsible icon rail. Persisted state lives in `useSidebarCollapsed` (`useSyncExternalStore` + `localStorage` key `mp:sidebar-collapsed` + custom event for cross-component sync). `DashboardShell`'s `<aside>` width (`md:w-16` ↔ `md:w-64`) reads from the same hook. Pass `forceExpanded` to `Sidebar` when rendering inside `MobileDrawer` (sheet always shows full content).
- Mobile `BottomNav` is a single pill bar (no separate FAB row) with a raised center FAB. Layout: 2 tabs | center FAB column (`w-14`) | 2 tabs. Active tab indicator uses Framer Motion `layoutId="bottom-nav-pill"` for shared-element transition. FAB action is context-aware via `useFABAction` (palace → New Room, room → New Memory, else New Palace) and uses the `?action=...` URL-param pattern.
- All tab links and the FAB satisfy the 48px touch target: `min-w-touch min-h-touch` on tabs, `h-14 w-14` on the FAB.
- CSS vars (in `apps/web/src/app/globals.css`): `--height-bottom-nav: 5.5rem`, `--height-top-bar: 3.5rem`, `--spacing-touch: 48px`. Pages that need their last element tappable above the bar must add their own bottom padding — the shell intentionally does not. Use the Tailwind v4 canonical form `pb-(--height-bottom-nav) md:pb-0` (NOT `pb-[var(--height-bottom-nav)]` — IDE will flag it). Same pattern applies to sticky footers that must clear the bottom nav: `sticky bottom-(--height-bottom-nav) md:static md:bottom-auto` (see [apps/web/src/features/practice/components/QuizSession.tsx](apps/web/src/features/practice/components/QuizSession.tsx)).
- There is no standalone `MobileFAB` component. The FAB is embedded in `BottomNav`.

## Commands

```bash
pnpm dev                          # turbo dev (all packages)
pnpm --filter @memory-palace/web dev
pnpm test:unit                    # vitest across workspace
pnpm --filter @memory-palace/web test:unit -- <pattern>
pnpm check:prepush                # guardrails + lint + format:check + build (run before pushing)
pnpm exec playwright test         # builds web then runs e2e
pnpm --filter @memory-palace/web db:seed
```

Node ≥22, pnpm ≥9. Git hooks are auto-installed via `prepare` → `scripts/setup-git-hooks.sh`.

## Don't

- Don't add `middleware.ts` (guardrail fails). Edit `proxy.ts`.
- Don't import from `drizzle-orm` directly in app code — go through `@/db` (it re-exports operators alongside the schema).
- Don't bypass `defineAction` for server mutations (loses auth + rate limit + error envelope).
- Don't deep-import into `features/*/`; use the barrel.
