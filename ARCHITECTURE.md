# Architecture — current state

> Describes only what is **built and chosen**. Speculative future-phase decisions live in per-phase ADRs under `docs/adr/`. The aspirational pre-build design lives in `docs/archive/ARCHITECTURE-aspirational.md` for reference.

## Stack (in use today)

| Layer      | Tool                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| Framework  | Next.js 16.2.4 (App Router) with React Compiler                                     |
| Hosting    | Vercel                                                                              |
| Auth       | Supabase Auth via `@supabase/ssr`                                                   |
| Database   | Supabase Postgres (Supavisor pooled, port 6543) · 7-table schema live · RLS enabled |
| ORM        | Drizzle ORM — schema + relations + types in `packages/db/src/`                      |
| Styling    | Tailwind v4 + shadcn primitives in `@memory-palace/ui`; dark mode via `next-themes` |
| Rate limit | Upstash Redis (`@upstash/ratelimit`) — sliding window; no-op when env vars absent   |
| i18n       | None (added when a second locale is required)                                       |
| Validation | Zod (env + server-action input)                                                     |
| Testing    | Vitest + Testing Library; Playwright wired but no E2E specs yet                     |
| Quality    | TypeScript strict, ESLint with `eslint-plugin-boundaries`, Prettier                 |
| CI         | GitHub Actions: lint, typecheck, format, build, guardrails                          |

Anything else mentioned in older docs (Yjs/CRDT, Sentry, kbar, Recharts, framer-motion, R3F) is **not chosen yet** — when it lands, an ADR records the decision.

## Monorepo

```
apps/web              Next.js app
packages/db           Drizzle client, 7-table schema, relations, inferred TS types
packages/ui           shadcn-style primitives + cn() helper
packages/eslint-config
packages/typescript-config
```

Workspace packages export TypeScript source directly (`main: ./src/index.ts`); they are not pre-built. Turbo `typecheck` depends on `^typecheck`, not `^build`.

## Routing & auth flow

- `apps/web/src/proxy.ts` — Next.js 16 proxy (replacement for `middleware.ts`). Calls Supabase `getUser()` to refresh the session via `createSupabaseForProxy(request)`, which owns its own response so the proxy never holds a `let`. Public paths are matched on first-segment equality (`/login`, `/signup`, `/about`, `/callback`) rather than `startsWith`, so `/loginhacks` does not match.
- `apps/web/src/app/(auth)/callback/route.ts` — exchanges the email-confirmation `code` for a session, then redirects to a path-validated `next` query param (defaults to `/`).
- `apps/web/src/app/(dashboard)/layout.tsx` — renders the shell only. Auth enforcement is the proxy + RLS; the layout intentionally does **not** make a second Supabase call per navigation.

A CI guardrail (`scripts/ci/check-guardrails.mjs`) blocks reintroducing `middleware.ts`.

## Supabase client factories

All Supabase usage goes through `apps/web/src/shared/lib/supabase.ts`:

- `createSupabaseFromCookies()` — Server Components, Server Actions, Route Handlers reading `next/headers`.
- `createSupabaseForResponse(request, response)` — handlers that have an existing `NextResponse`.
- `createSupabaseForProxy(request)` — returns `{ supabase, getResponse }`; the factory owns the response that carries refreshed cookies.
- `auth()` — convenience over `createSupabaseFromCookies`.

There is no browser-side Supabase client today. Auth is fully cookie-based via server actions; if a future feature needs Supabase Realtime in the browser, add `createSupabaseBrowser` then.

## Environment variables

`apps/web/src/shared/lib/env.ts` parses required env vars with Zod at module load and throws a single readable error if anything is missing or malformed. **No file should reference `process.env.X!` directly** — import `env` instead. Keys validated today:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase's modern RLS-gated browser-safe key (`sb_publishable_...`). The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback with a deprecation warning so existing local envs keep working until they are rotated.

`DATABASE_URL` is read inside `packages/db/src/client.ts` lazily. Callers obtain the drizzle instance via `getDb()` from `@memory-palace/db`; the connection is created on the first call and cached. Importing the package never reads `DATABASE_URL`.

## Feature isolation

`src/features/<domain>/` directories are created **only when work begins**. Empty-barrel placeholders are not committed. Cross-feature imports are forbidden by `eslint-plugin-boundaries`; cross-cutting code goes to `src/shared/`. Components are exported by name (no `export default` outside route files).

## Styling & theming

CSS custom properties drive Tailwind v4 utilities in `apps/web/src/app/globals.css`. Mobile-first: base styles for mobile, `md:` and `lg:` for progressive override. No `max-*:` breakpoints.

**Dark mode** is managed by `next-themes`. The root layout wraps all children in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` (from `apps/web/src/shared/components/ThemeProvider.tsx`). When the user picks dark mode, `next-themes` toggles the `.dark` class on `<html>`. `globals.css` defines two token sets — `:root` (light) and `.dark` — and maps them into Tailwind v4 utilities via `@theme inline`. A `@custom-variant dark (&:is(.dark *))` declaration lets standard `dark:` utility classes resolve under the `.dark` class strategy.

The `ModeToggle` component (in `src/features/dashboard/components/`) cycles through light → dark → system and is placed in both the sidebar footer and the top bar on mobile.

## Database schema

Seven tables: `users`, `palaces`, `rooms`, `nodes`, `edges`, `tags`, `node_tags`. Key design choices:

- `node_type` is a `pgEnum` so the DB enforces the valid set.
- `nodes.user_id` is denormalised (also stored on the node directly) to make the RLS policy an O(1) index lookup rather than a join chain (`node → room → palace → user`).
- All FKs use `onDelete: 'cascade'`. Edges have no `deleted_at` — they're cheap to recreate; cascade handles orphan cleanup.
- `palaces.deleted_at` enables soft delete. Server actions filter `IS NULL` on reads.
- `$onUpdate(() => new Date())` keeps `updated_at` current at the Drizzle layer. Direct SQL edits bypass this; a Postgres trigger is the long-term fix.
- Migration SQL is in `packages/db/migrations/`. A manual GIN FTS index on `nodes.content` was applied post-migration (see `packages/db/migrations/README.md`).

## Row-level security

RLS is enabled on all 7 tables. Key policy decisions:

- `palaces`, `tags`: `auth.uid() = user_id` — direct, no join.
- `nodes`: `auth.uid() = user_id` — uses the denormalised column, no join.
- `rooms`: `EXISTS (SELECT 1 FROM palaces WHERE id = palace_id AND user_id = auth.uid())`.
- `edges`: `EXISTS (SELECT 1 FROM nodes WHERE id = source_node_id AND user_id = auth.uid())` — one indexed lookup on the source node; the unique-edge constraint ensures source and target belong to the same user.
- `node_tags`: `EXISTS (SELECT 1 FROM nodes WHERE id = node_id AND user_id = auth.uid())`.
- `users`: SELECT + UPDATE only for own row; no INSERT (populated by the `handle_new_auth_user` trigger).

An `AFTER INSERT ON auth.users` trigger (`handle_new_auth_user`, `SECURITY DEFINER`) syncs new sign-ups into `public.users`. Without it, palace inserts would FK-fail.

## Server actions

Palace CRUD lives in `src/features/palaces/actions/`. Node queries live in `src/features/nodes/actions/`. Pattern for all CRUD/query actions:

```typescript
'use server';
// 1. Auth check
const { data: { user } } = await auth();
if (!user) return { success: false, error: { code: 'UNAUTHORIZED', … } };
// 2. (mutating actions only) Rate limit
const { success: ok } = await checkRateLimit(user.id, 'write');
if (!ok) return { success: false, error: { code: 'TOO_MANY_REQUESTS', … } };
// 3. Zod parse
const parsed = schema.safeParse(input);
if (!parsed.success) return { success: false, error: { code: 'VALIDATION_FAILED', … } };
// 4. Query
const db = getDb();
// … drizzle query …
```

All actions return `ActionResponse<T>` (defined in `src/shared/types.ts`) — a discriminated union with `{ success: true; data: T }` or `{ success: false; error: { code: ErrorCode; message: string } }`. Auth form actions keep their existing `AuthFormState` shape for `useActionState` flows.

**Rate limiting** uses Upstash Redis sliding windows via `src/shared/lib/ratelimit.ts`. Two buckets: `write` (30 req/10 s) and `search` (60 req/10 s). When `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are absent the limiter returns `{ success: true }` — safe for local dev. Set both vars in Vercel for production enforcement.

**Cursor pagination** (`getNodesByRoom`) uses an opaque base64url cursor encoding `{ createdAt, id }`. The query uses a Postgres row comparison — `(created_at, id) < (cursor_ts, cursor_id)` — which is cleaner and more planner-friendly than an OR expansion. The fetch-limit+1 trick avoids a separate `COUNT` query.

**Full-text search** (`searchNodes`) uses `websearch_to_tsquery` (supports `-negation`, `OR`, natural AND; Postgres 11+) against the GIN `tsvector` index on `nodes`. Results are ordered by `ts_rank` descending, then by `created_at` descending.

**`@memory-palace/db` re-exports drizzle helpers** (`eq`, `and`, `sql`, `desc`, etc.) so all workspace packages share one virtual-store resolution. Importing Drizzle helpers directly from `'drizzle-orm'` in `apps/web` would create a second peer-resolved instance (due to `@upstash/redis`'s optional `drizzle-orm` peer), causing structural type mismatches. All action files import helpers from `'@memory-palace/db'`.

## Known gaps (do not infer they are decided)

- No CSP. App-Router-correct CSP needs per-request nonces; rather than ship a permissive header that lies about its protection, no CSP is sent until the Phase 8 hardening pass adds nonce middleware.
- No coverage gating. Vitest is configured for tests only — re-add `coverage` config and wire `--coverage` into CI when there is enough surface to gate against.
