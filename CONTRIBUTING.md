# Contributing Guide — Memory Palace App

This document covers everything you need to get the Memory Palace app running locally, contribute a feature, and get your pull request merged.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Recommended VS Code Extensions](#2-recommended-vs-code-extensions)
3. [Initial Setup](#3-initial-setup)
4. [Environment Variables](#4-environment-variables)
5. [Common Commands Reference](#5-common-commands-reference)
6. [Creating a New Feature](#6-creating-a-new-feature)
7. [Creating a Database Migration](#7-creating-a-database-migration)
8. [Code Style Rules](#8-code-style-rules)
9. [PR Checklist](#9-pr-checklist)

---

## 1. Prerequisites

Ensure the following tools are installed before starting:

| Tool                  | Version | Purpose                                             |
| --------------------- | ------- | --------------------------------------------------- |
| Node.js               | 20+     | JavaScript runtime                                  |
| pnpm                  | 9+      | Package manager (required for Turborepo workspaces) |
| Docker                | Latest  | Local Supabase instance                             |
| Git                   | Latest  | Version control                                     |
| VS Code (recommended) | Latest  | IDE with recommended extensions                     |

Install pnpm globally if not already installed:

```bash
npm install -g pnpm@9
```

---

## 2. Recommended VS Code Extensions

Create or update `.vscode/extensions.json` with the following extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "Drizzle.drizzle-vscode",
    "eamodio.gitlens",
    "usernamehw.errorlens"
  ]
}
```

| Extension                 | ID                          | Purpose                          |
| ------------------------- | --------------------------- | -------------------------------- |
| ESLint                    | `dbaeumer.vscode-eslint`    | Real-time lint feedback          |
| Prettier                  | `esbenp.prettier-vscode`    | Auto-format on save              |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Class autocomplete and docs      |
| Drizzle ORM               | `Drizzle.drizzle-vscode`    | Schema syntax highlighting       |
| GitLens                   | `eamodio.gitlens`           | Git blame, history, and insights |
| Error Lens                | `usernamehw.errorlens`      | Inline error/warning messages    |

---

## 3. Initial Setup

Follow these steps exactly on a fresh clone:

```bash
# 1. Clone the repository
git clone https://github.com/brailapetru78/memory-palace-app.git
cd memory-palace-app

# 2. Install dependencies
pnpm install

# 2.1 Install local git hooks (recommended)
pnpm hooks:install

# 3. Start local Supabase (requires Docker)
npx supabase init
npx supabase start
# This outputs: API URL, anon key, service_role key — copy these

# 4. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Fill in the Supabase keys from step 3

# 5. Run database migrations
pnpm --filter @memory-palace/db drizzle-kit push

# 6. Seed development data
pnpm --filter @memory-palace/db seed

# 7. Start development server
pnpm turbo dev
# App runs at http://localhost:3000
```

### Verifying the Setup

After completing the steps above:

- Open `http://localhost:3000` — you should see the login page
- Open `http://localhost:54323` — Supabase Studio (local database GUI)
- Run `pnpm turbo typecheck` — should pass with zero errors

---

## 4. Environment Variables

The `.env.example` file documents all required variables. Copy it to `.env.local` and fill in your local values:

```env
# Supabase (use local values from `supabase start` output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Database (use the POOLED connection for production, direct for local)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Upstash Redis (use local mock or Upstash free tier)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Sentry (optional for local development)
SENTRY_DSN=

# Vercel (only needed for deployment)
VERCEL_TOKEN=
```

### Variable Reference

| Variable                        | Required Locally    | Description                                   |
| ------------------------------- | ------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅ Yes              | Supabase project URL (exposed to browser)     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes              | Supabase public anon key (exposed to browser) |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅ Yes (local only) | Bypasses RLS — only for migrations and seeds  |
| `DATABASE_URL`                  | ✅ Yes              | Pooled PostgreSQL connection string           |
| `UPSTASH_REDIS_REST_URL`        | ✅ Yes              | Upstash Redis endpoint for rate limiting      |
| `UPSTASH_REDIS_REST_TOKEN`      | ✅ Yes              | Upstash Redis auth token                      |
| `SENTRY_DSN`                    | ⬜ Optional         | Sentry error reporting (skip for local dev)   |
| `VERCEL_TOKEN`                  | ⬜ Optional         | Only needed for deployment workflows          |

> **Security Note:** Never commit `.env.local`. It is already in `.gitignore`. See `SECURITY.md` §5 for the full `SUPABASE_SERVICE_ROLE_KEY` usage policy.

---

## 5. Common Commands Reference

### Development

| Command                    | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `pnpm turbo dev`           | Start all apps in development mode                  |
| `pnpm turbo build`         | Build all apps and packages                         |
| `pnpm turbo lint`          | Run ESLint across all packages                      |
| `pnpm turbo typecheck`     | Run TypeScript strict check                         |
| `pnpm turbo format:check`  | Check Prettier formatting                           |
| `pnpm turbo format`        | Auto-fix Prettier formatting                        |
| `pnpm check:guardrails`    | Fail if Next.js proxy entrypoints are misconfigured |
| `pnpm check:vercel-config` | Validate `vercel.json` syntax and required keys     |
| `pnpm check:prepush`       | Run guardrails + lint + format + web build checks   |

### Database

| Command                                                | Description                                     |
| ------------------------------------------------------ | ----------------------------------------------- |
| `pnpm --filter @memory-palace/db drizzle-kit generate` | Generate a new migration from schema changes    |
| `pnpm --filter @memory-palace/db drizzle-kit push`     | Push schema to database (skips migration files) |
| `pnpm --filter @memory-palace/db drizzle-kit studio`   | Open Drizzle Studio (database GUI)              |
| `pnpm --filter @memory-palace/db seed`                 | Seed development data                           |

### Testing

| Command                          | Description                       |
| -------------------------------- | --------------------------------- |
| `pnpm exec playwright test`      | Run E2E tests (headless)          |
| `pnpm exec playwright test --ui` | Run E2E tests with interactive UI |

### Local Supabase

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npx supabase start`    | Start local Supabase (requires Docker) |
| `npx supabase stop`     | Stop local Supabase                    |
| `npx supabase db reset` | Reset local database (drops all data)  |

---

## 6. Creating a New Feature

Full walkthrough from branch creation to merge:

```bash
# 1. Always start from latest main
git checkout main && git pull origin main

# 2. Create feature branch
git checkout -b feat/your-feature-name

# 3. Develop your feature in the correct feature slice
#    e.g., src/features/spatial-canvas/ or src/features/memory-nodes/

# 4. Run checks locally (same as CI)
pnpm turbo lint
pnpm turbo typecheck
pnpm exec playwright test

# 5. Commit with conventional commits
git add .
git commit -m "feat(canvas): add batch node save server action"

# 6. Push and open PR
git push -u origin feat/your-feature-name
# Open PR via GitHub UI or `gh pr create`

# 7. Wait for CI to pass → Squash merge via GitHub UI
```

### Feature Slice Location

Features must be placed in the correct directory under `src/features/`:

| Feature                    | Directory                      |
| -------------------------- | ------------------------------ |
| Canvas drag, Zustand store | `src/features/spatial-canvas/` |
| Node CRUD, Zod schemas     | `src/features/memory-nodes/`   |
| Full-text search           | `src/features/search/`         |
| Auth flows                 | `src/features/auth/`           |
| Shared utilities           | `src/shared/`                  |

See `ARCHITECTURE.md` §4 for the complete directory structure.

---

## 7. Creating a Database Migration

All schema changes must be accompanied by a Drizzle migration file. Follow these steps:

```bash
# 1. Edit packages/db/src/schema.ts with your changes

# 2. Generate the migration SQL
pnpm --filter @memory-palace/db drizzle-kit generate

# 3. Review the generated SQL in packages/db/migrations/

# 4. Test locally
pnpm --filter @memory-palace/db drizzle-kit push

# 5. Commit both the schema change AND the migration file
git add packages/db/
git commit -m "chore(db): add tags table and node_tags join table"
```

### Important Notes

- Never manually edit generated migration files
- Always review the generated SQL before committing — check for destructive operations (e.g., `DROP COLUMN`)
- Follow the two-phase migration strategy for destructive changes (see `ARCHITECTURE.md` §5.E)
- The `migrate.yml` workflow automatically applies migrations to production when changes merge to `main`

---

## 8. Code Style Rules

These rules are enforced by ESLint, TypeScript, and Prettier. Violations block CI.

### Feature Isolation

Never import directly between feature directories. Cross-feature code lives in `shared/`.

```typescript
// ❌ Wrong — importing from another feature
import { useNodeStore } from '@/features/spatial-canvas/store';
// in: src/features/memory-nodes/components/NodeCard.tsx

// ✅ Correct — use shared abstractions
import { useCurrentRoomNodes } from '@/shared/hooks/useCurrentRoomNodes';
```

### Component Files

- One component per file
- Named exports only (no default exports)
- Exception: Next.js App Router entry files must use default exports (`src/app/**/page.tsx`, `src/app/**/layout.tsx`, and other route entry conventions)

```typescript
// ✅ Correct
export function NodeCard({ node }: NodeCardProps) { ... }

// ❌ Wrong
export default function NodeCard({ node }: NodeCardProps) { ... }
```

### Server Actions

Every Server Action must follow this pattern — no exceptions:

1. Validate input with Zod
2. Check rate limit with `checkRateLimit()`
3. Execute database operation via pooled Drizzle connection

```typescript
'use server';

import { z } from 'zod';
import { db } from '@memory-palace/db';
import { checkRateLimit } from '@/shared/lib/rate-limit';

const Schema = z.object({ /* ... */ });

export async function myServerAction(input: unknown) {
  const parsed = Schema.parse(input);  // 1. Validate
  await checkRateLimit();              // 2. Rate limit
  return db./* query */;              // 3. Database
}
```

### State Management

| State Type                    | Tool             | Rule                                       |
| ----------------------------- | ---------------- | ------------------------------------------ |
| Canvas coordinates (X/Y)      | Zustand          | Never persisted during drag — only on drop |
| Server data (palaces, nodes)  | TanStack Query   | Never store in Zustand                     |
| UI state (modals, selections) | React `useState` | Component-local only                       |

Never mix: canvas coordinates must not go into TanStack Query; server data must not live in Zustand.

---

## 9. PR Checklist

Copy this checklist into every pull request description before opening it for review:

```markdown
## PR Checklist

- [ ] Branch follows naming convention (`feat/`, `fix/`, `chore/`, etc.)
- [ ] Commit messages follow conventional commits
- [ ] All new Server Actions have Zod validation
- [ ] All new Server Actions have rate limiting
- [ ] No direct Supabase client calls from components (use Server Actions)
- [ ] No hardcoded strings (use translation keys if i18n is set up)
- [ ] TypeScript strict mode passes (`pnpm turbo typecheck`)
- [ ] ESLint passes (`pnpm turbo lint`)
- [ ] Playwright tests pass (or new tests added)
- [ ] Database migration generated (if schema changed)
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` used in Server Actions
```
