# Roadmap — current

The aspirational 11-phase plan lives at `docs/archive/ROADMAP-aspirational.md`. It is reference material, not a contract.

## Done

- **Phase 1 — Foundation & DevOps.** Monorepo (Turbo + pnpm), Supabase auth via proxy, callback route, CI/CD, git hooks, Vercel config.
- **Phase 2A — Layout components.** `DashboardShell`, `Sidebar`, `BottomNav`, `MobileDrawer`.
- **Cleanup pass.** Removed empty feature dirs and duplicate `cn`. Consolidated three Supabase SSR factories into one module. Extracted `redirectWithCookies` in the proxy. Added Zod-validated `env` module. Dropped redundant per-navigation auth round-trip in dashboard layout. Made `db` client lazy. Fixed `turbo` `typecheck` dependency. Pinned `lucide-react`. Trimmed docs.
- **Phase 2B — Theme system.** `next-themes` + `ThemeProvider` in root layout. 3-way `ModeToggle` (light → dark → system) in sidebar footer and top bar. Dark-mode CSS token set (`.dark {}`) in `globals.css`; `@custom-variant dark` wired for Tailwind v4.
- **Phase 2C — Base components.** `Input`, `Alert`, `Skeleton`, `Sheet`, `Label`, `Card` (+ `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`) added to `@memory-palace/ui`. `LoginForm` and `SignupForm` refactored to use them with proper accessible `<label>` associations. `EmptyState` and `CardSkeleton` added to `src/shared/components/`.
- **Phase 3A — DB schema.** Drizzle schema: 7 tables (`users`, `palaces`, `rooms`, `nodes`, `edges`, `tags`, `node_tags`), `pgEnum` for node type, explicit indexes on every FK, `$onUpdate` for `updatedAt`, cascade deletes, Drizzle `relations()` for the relational query API, inferred TypeScript types exported, `drizzle.config.ts` wired for `DIRECT_DATABASE_URL`, seed script with dev fixtures, migration notes for manual GIN FTS index.

- **Phase 3B — RLS + Server Actions.** Per-table RLS policies on all 7 tables. `auth.users → public.users` sync trigger (`handle_new_auth_user`, SECURITY DEFINER) with backfill of pre-existing users. `ActionResponse<T>` + `ErrorCode` shared types in `src/shared/types.ts`. Palace CRUD server actions (`createPalace`, `getPalaces`, `getPalaceById`, `updatePalace`, `deletePalace`) with Zod-validated input, soft delete on palaces, auth guard on every action. Rate-limit ADR written (`docs/adr/3b-rate-limiting.md`) — Upstash Redis, deferred to Phase 3C.

## Next (concrete, in order)

1. **Phase 3C — Search.** Apply the GIN `tsvector` index (see `packages/db/migrations/README.md`); cursor pagination on node queries. Wire Upstash rate limiting (see `docs/adr/3b-rate-limiting.md`).
2. **Phase 4+ — Dashboard pages, spatial canvas, etc.** Decide the canvas/CRDT story in an ADR before writing code; the aspirational doc names Yjs+y-supabase but that has not been validated.

## Operating rules

- One PR per phase sub-step. Squash to `main`.
- Before any phase that introduces a new dependency (Yjs, kbar, Sentry, etc.), write an ADR in `docs/adr/` and link it from this file.
- Don't grow the documentation faster than the codebase. If a doc is bigger than the code it describes, trim the doc.
