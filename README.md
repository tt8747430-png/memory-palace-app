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

## Implementation status (2026-05-05)

| Phase                                                                         | Status         |
| ----------------------------------------------------------------------------- | -------------- |
| 1 — Foundation & DevOps (monorepo, Supabase auth, CI/CD, git hooks)           | ✅ Complete    |
| 2A — Responsive shell (DashboardShell, Sidebar, BottomNav, drawer)            | ✅ Complete    |
| Cleanup & consolidation pass                                                  | ✅ Complete    |
| 2B — Theme system (dark/light/system toggle, next-themes)                     | ✅ Complete    |
| 2C — Base components (Input, Alert, Skeleton, Sheet, Label, Card, EmptyState) | ✅ Complete    |
| 3 — Data layer & security (Drizzle schema, RLS, server actions)               | ⬜ Not started |
| 4+ — Subsequent phases                                                        | ⬜ Not started |

## Quick start

```bash
pnpm install
pnpm turbo dev        # http://localhost:3000
```

Requires `apps/web/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the new RLS-gated browser-safe key — `sb_publishable_...`). See `.env.example`. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still accepted with a deprecation warning. Env vars are validated by `apps/web/src/shared/lib/env.ts` on boot — missing or malformed values fail fast with a clear message.

## License

See [LICENSE](./LICENSE).
