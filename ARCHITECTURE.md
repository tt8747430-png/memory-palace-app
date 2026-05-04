# Architecture — current state

> Describes only what is **built and chosen**. Speculative future-phase decisions live in per-phase ADRs under `docs/adr/`. The aspirational pre-build design lives in `docs/archive/ARCHITECTURE-aspirational.md` for reference.

## Stack (in use today)

| Layer      | Tool                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| Framework  | Next.js 16.2.4 (App Router) with React Compiler                          |
| Hosting    | Vercel                                                                   |
| Auth       | Supabase Auth via `@supabase/ssr`                                        |
| Database   | Supabase Postgres (Supavisor pooled, port 6543) — schema not yet defined |
| ORM        | Drizzle (client wired, schema empty — Phase 3)                           |
| Styling    | Tailwind v4 + shadcn primitives in `@memory-palace/ui`                   |
| i18n       | None (added when a second locale is required)                            |
| Validation | Zod (env + server-action input)                                          |
| Testing    | Vitest + Testing Library; Playwright wired but no E2E specs yet          |
| Quality    | TypeScript strict, ESLint with `eslint-plugin-boundaries`, Prettier      |
| CI         | GitHub Actions: lint, typecheck, format, build, guardrails               |

Anything else mentioned in older docs (Yjs/CRDT, Upstash rate limiting, Sentry, kbar, Recharts, framer-motion, R3F, next-themes) is **not chosen yet** — when it lands, an ADR records the decision.

## Monorepo

```
apps/web              Next.js app
packages/db           Drizzle client + schema (schema empty until Phase 3)
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

## Styling tokens

CSS custom properties drive Tailwind v4 utilities (`--text-mobile-h1`, `--spacing-safe-bottom`, `--min-height-touch`, etc.) in `apps/web/src/app/globals.css`. Mobile-first: base styles for mobile, `md:` and `lg:` for progressive override. No `max-*:` breakpoints.

## Known gaps (do not infer they are decided)

- No DB schema — `packages/db/src/schema.ts` is empty until Phase 3.
- No rate limiting — to be designed in an ADR before Phase 3 ships.
- No CSP. App-Router-correct CSP needs per-request nonces; rather than ship a permissive header that lies about its protection, no CSP is sent until the Phase 8 hardening pass adds nonce middleware.
- No coverage gating. Vitest is configured for tests only — re-add `coverage` config and wire `--coverage` into CI when there is enough surface to gate against.
