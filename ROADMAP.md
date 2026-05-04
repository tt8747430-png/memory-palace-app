# Roadmap — current

The aspirational 11-phase plan lives at `docs/archive/ROADMAP-aspirational.md`. It is reference material, not a contract.

## Done

- **Phase 1 — Foundation & DevOps.** Monorepo (Turbo + pnpm), Supabase auth via proxy, callback route, CI/CD, git hooks, Vercel config.
- **Phase 2A — Layout components.** `DashboardShell`, `Sidebar`, `BottomNav`, `MobileDrawer`.
- **Cleanup pass (this branch).** Removed empty feature dirs and duplicate `cn`. Consolidated three Supabase SSR factories into one module. Extracted `redirectWithCookies` in the proxy. Added Zod-validated `env` module. Dropped redundant per-navigation auth round-trip in dashboard layout. Made `db` client lazy. Fixed `turbo` `typecheck` dependency. Pinned `lucide-react`. Trimmed docs.

## Next (concrete, in order)

1. **Phase 2B — Theme system.** `next-themes`, dark/light toggle, OS preference detection. ADR for token strategy.
2. **Phase 2C — Base components.** Add `Input`, `Label`, `Form`, `Card` to `@memory-palace/ui`. Refactor `LoginForm` / `SignupForm` to use them.
3. **Phase 3A — DB schema.** Define `users`, `palaces`, `rooms`, `nodes`, `edges`, `tags`, `node_tags` in Drizzle. Two-phase migrations for destructive changes.
4. **Phase 3B — RLS + Server Actions.** Per-table RLS policies. `ActionResponse<T>` shape. Zod-validated input. Rate-limit ADR before this lands.
5. **Phase 3C — Search.** `tsvector` column + GIN index on nodes; cursor pagination.
6. **Phase 4+ — Dashboard pages, spatial canvas, etc.** Decide the canvas/CRDT story in an ADR before writing code; the aspirational doc names Yjs+y-supabase but that has not been validated.

## Operating rules

- One PR per phase sub-step. Squash to `main`.
- Before any phase that introduces a new dependency (Yjs, kbar, Sentry, etc.), write an ADR in `docs/adr/` and link it from this file.
- Don't grow the documentation faster than the codebase. If a doc is bigger than the code it describes, trim the doc.
