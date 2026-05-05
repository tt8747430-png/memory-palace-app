# Memory Palace App

A spatial, interactive learning platform where users create virtual "palaces" with rooms containing draggable memory nodes on a 2D canvas.

## Documentation

| Document                             | Description                                                            |
| ------------------------------------ | ---------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Current-state architecture: stack, monorepo layout, Supabase factories |
| [ROADMAP.md](./ROADMAP.md)           | What is built and what is next                                         |
| [CLAUDE.md](./CLAUDE.md)             | Conventions and patterns for working in this repo                      |
| [DEVELOPMENT.md](./DEVELOPMENT.md)   | Branching, CI/CD, daily workflow                                       |
| [TESTING.md](./TESTING.md)           | Testing strategy — Vitest, Testing Library, Playwright                 |
| [SECURITY.md](./SECURITY.md)         | Threat model, RLS, vulnerability reporting                             |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | PR process, commit conventions                                         |
| [docs/archive/](./docs/archive)      | Pre-build aspirational designs — reference only, not authoritative     |
| [docs/adr/](./docs/adr)              | Per-phase architecture decision records — added when phases begin      |

## Implementation status

| Phase                                                                         | Status         |
| ----------------------------------------------------------------------------- | -------------- |
| 1 — Foundation & DevOps (monorepo, Supabase auth, CI/CD, git hooks)           | ✅ Complete    |
| 2A — Responsive shell (DashboardShell, Sidebar, BottomNav, drawer)            | ✅ Complete    |
| Cleanup & consolidation pass                                                  | ✅ Complete    |
| 2B — Theme system (dark/light/system toggle, next-themes)                     | ✅ Complete    |
| 2C — Base components (Input, Alert, Skeleton, Sheet, Label, Card, EmptyState) | ✅ Complete    |
| 3A — DB schema (7-table Drizzle schema, migrations, GIN FTS index)            | ✅ Complete    |
| 3B — RLS + server actions (palace CRUD, per-table RLS, auth trigger)          | ✅ Complete    |
| 3C — Rate limiting, FTS search, cursor pagination (Upstash, nodes feature)    | ✅ Complete    |
| 4+ — Subsequent phases (canvas, CRDT, etc.)                                   | ⬜ Not started |

## Quick start

```bash
pnpm install
pnpm turbo dev        # http://localhost:3000
```

Requires `apps/web/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the RLS-gated browser-safe key — `sb_publishable_...`). `DATABASE_URL` (pooled Supavisor, port 6543) is required for server actions. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are optional — rate limiting is a no-op without them (safe for local dev). See `.env.example`. Env vars are validated by `apps/web/src/shared/lib/env.ts` on boot — missing or malformed values fail fast with a clear message.

## License

See [LICENSE](./LICENSE).
