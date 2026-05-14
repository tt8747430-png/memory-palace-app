# CLAUDE.md — memory-palace-app

Next.js 16 + React 19 (React Compiler on) memory-palace SPA. Single-package Turborepo pnpm project , Supabase auth, Postgres via Drizzle, TanStack Query, Zustand, Framer Motion, React Flow.

## Repo layout

- `src/db/` (`@/db`)
- `src/ui/` (`@/ui`) —
- `src/features/<name>/`
- `src/shared/{lib,components,hooks}/`
- `src/app/`
- `drizzle.config.ts` (root)
- `eslint.config.mjs` + `tsconfig.json`
- `.storybook/` (root)
- Tests: unit/integration co-located in `__tests__/` (vitest, jsdom); e2e in `playwright/tests`.

## Commands

```bash
pnpm dev
pnpm build
pnpm test:unit
pnpm test:unit -- <pattern>
pnpm check:prepush
pnpm exec playwright test
pnpm db:seed
pnpm db:push
```

Node ≥22, pnpm ≥9. Git hooks are auto-installed via `prepare` → `scripts/setup-git-hooks.sh`.
