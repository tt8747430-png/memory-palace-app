# Development & DevOps Guide — Memory Palace App

This document covers the complete development workflow, CI/CD pipeline, branching strategy, secrets management, and daily developer practices.

---

## Table of Contents

1. [Branching Strategy](#1-branching-strategy)
2. [Branch Naming Convention](#2-branch-naming-convention)
3. [Release & Tagging Strategy](#3-release--tagging-strategy)
4. [Conventional Commit Format](#4-conventional-commit-format)
5. [GitHub Actions CI/CD Pipeline](#5-github-actions-cicd-pipeline)
6. [Branch Protection Rules](#6-branch-protection-rules-for-main)
7. [GitHub Labels System](#7-github-labels-system)
8. [GitHub Project Board](#8-github-project-board)
9. [Daily Developer Workflow](#9-daily-developer-workflow)
10. [Secrets & Environment Management](#10-secrets--environment-management)
11. [DevOps Flow Diagram](#11-complete-devops-flow-diagram)

---

## 1. Branching Strategy: GitHub Flow

`main` is the **only** long-lived branch. It is always deployable and represents the current production state.

### Rules

- ❌ No direct pushes to `main`
- ✅ Every change goes through a Pull Request
- ✅ Squash merge only (clean, linear history)
- ✅ Delete branches after merge
- ✅ Feature branches are short-lived (hours to days, not weeks)

### Branch Diagram

```
main (production — always deployable)
 │
 ├── feat/spatial-canvas-drag
 ├── feat/supabase-auth
 ├── fix/canvas-error-boundary
 ├── chore/drizzle-migration-rooms
 └── ...
```

---

## 2. Branch Naming Convention

| Prefix      | Use Case                  | Example                         |
| ----------- | ------------------------- | ------------------------------- |
| `feat/`     | New feature               | `feat/yjs-realtime-sync`        |
| `fix/`      | Bug fix                   | `fix/zustand-stale-coordinates` |
| `chore/`    | Maintenance, deps, config | `chore/eslint-boundary-rules`   |
| `refactor/` | Code restructuring        | `refactor/extract-canvas-hooks` |
| `docs/`     | Documentation only        | `docs/architecture-readme`      |
| `test/`     | Adding or fixing tests    | `test/playwright-drag-drop`     |

---

## 3. Release & Tagging Strategy

### Semantic Versioning

| Tag      | Meaning                                          |
| -------- | ------------------------------------------------ |
| `v0.1.0` | Phase 1 complete — Infrastructure Skeleton       |
| `v0.2.0` | Phase 2 complete — Data Core & Security          |
| `v0.3.0` | Phase 3 complete — Spatial Canvas & State Engine |
| `v1.0.0` | First production release — Phase 4 complete      |
| `v1.x.y` | Post-launch patches and features                 |

### Changelog Generation

Tags trigger GitHub Releases with auto-generated changelogs via [`git-cliff`](https://github.com/orhun/git-cliff). Conventional commits are the input; the changelog is the output.

```bash
# Create a release tag
git tag -a v0.1.0 -m "Phase 1: Infrastructure Skeleton"
git push origin v0.1.0
# → triggers release.yml → GitHub Release with changelog
```

---

## 4. Conventional Commit Format

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples

```
feat(canvas): implement drag-and-drop with Zustand
fix(auth): resolve session refresh on middleware
chore(db): add index on nodes.room_id
refactor(canvas): extract useNodeDrag hook
docs(arch): update database schema section
test(e2e): add Playwright drag-and-drop spec
```

### Types

| Type       | When to use                                     |
| ---------- | ----------------------------------------------- |
| `feat`     | A new feature                                   |
| `fix`      | A bug fix                                       |
| `chore`    | Build process, dependencies, tooling            |
| `refactor` | Code change that is neither a fix nor a feature |
| `docs`     | Documentation only                              |
| `test`     | Adding or fixing tests                          |
| `perf`     | Performance improvements                        |
| `ci`       | CI/CD pipeline changes                          |

---

## 5. GitHub Actions CI/CD Pipeline

Four workflows handle the full delivery lifecycle.

### A. `ci.yml` — PR Quality Gate

Runs on every pull request. All checks must pass before merge is allowed.

- ESLint + Prettier
- TypeScript strict type-check
- Drizzle migration consistency check
- Playwright E2E tests

### B. `deploy.yml` — Vercel Deploy

- PR opened/updated → Vercel **preview** deployment
- Push to `main` → Vercel **production** deployment

### C. `migrate.yml` — Database Migration

- Triggered only when `packages/db/migrations/**` changes on `main`
- Runs `drizzle-kit migrate` against the production database

### D. `release.yml` — Automated Release

- Triggered on `v*` tags
- Generates changelog with `git-cliff`
- Creates a GitHub Release

---

## 6. Branch Protection Rules for `main`

| Rule                                                                              | Status            |
| --------------------------------------------------------------------------------- | ----------------- |
| Require a pull request before merging                                             | ✅ Enabled        |
| Require status checks to pass: `lint`, `typecheck`, `migration-check`, `test-e2e` | ✅ Enabled        |
| Require branches to be up to date before merging                                  | ✅ Enabled        |
| Require conversation resolution before merging                                    | ✅ Enabled        |
| Merge method                                                                      | Squash merge only |
| Automatically delete head branches                                                | ✅ Enabled        |
| Allow force pushes                                                                | ❌ Disabled       |
| Allow deletions of `main`                                                         | ❌ Disabled       |

---

## 7. GitHub Labels System

### Type Labels

| Label      | Color              | Description                |
| ---------- | ------------------ | -------------------------- |
| `feature`  | `#22c55e` (green)  | New feature or request     |
| `bug`      | `#ef4444` (red)    | Something isn't working    |
| `chore`    | `#eab308` (yellow) | Maintenance, deps, config  |
| `docs`     | `#3b82f6` (blue)   | Documentation improvements |
| `refactor` | `#a855f7` (purple) | Code restructuring         |

### Phase Labels

| Label               | Description                              |
| ------------------- | ---------------------------------------- |
| `phase:1-skeleton`  | Phase 1 — Infrastructure Skeleton        |
| `phase:2-data-core` | Phase 2 — Data Core & Security           |
| `phase:3-canvas`    | Phase 3 — Spatial Canvas & State Engine  |
| `phase:4-polish`    | Phase 4 — Polish, Assets & Observability |

### Domain Labels

| Label      | Description                         |
| ---------- | ----------------------------------- |
| `canvas`   | React Flow, Zustand, drag-and-drop  |
| `database` | Drizzle schema, migrations, RLS     |
| `auth`     | Supabase Auth, session management   |
| `search`   | Full-text search, tsvector          |
| `ci-cd`    | GitHub Actions, Vercel, deployments |

---

## 8. GitHub Project Board (Kanban)

The project board uses a standard Kanban layout:

| Column          | Definition                       |
| --------------- | -------------------------------- |
| **Backlog**     | Planned but not yet scheduled    |
| **Sprint**      | Scheduled for the current sprint |
| **In Progress** | Being actively worked on         |
| **In Review**   | PR open, awaiting review         |
| **Done**        | Merged to `main`                 |

---

## 9. Daily Developer Workflow

### Step-by-Step Commands

```bash
# 1. Sync with latest main
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feat/my-new-feature

# 3. Install dependencies (if package.json changed)
pnpm install

# 4. Start the dev server
pnpm dev

# 5. Make changes, then commit with conventional commits
git add .
git commit -m "feat(canvas): implement node resize handles"

# 6. Push and open a PR
git push origin feat/my-new-feature
# → Open PR on GitHub → CI runs automatically

# 7. After PR is reviewed and CI passes → Squash Merge

# 8. Clean up local branch
git checkout main
git pull origin main
git branch -d feat/my-new-feature

# 9. (On release) Tag the version
git tag -a v0.1.0 -m "Phase 1: Infrastructure Skeleton complete"
git push origin v0.1.0
```

---

## 10. Secrets & Environment Management

### Secret Table

| Secret                          | Description                                              | Used In                     | Stored In                               |
| ------------------------------- | -------------------------------------------------------- | --------------------------- | --------------------------------------- |
| `DATABASE_URL`                  | Pooled Supabase connection string (Supavisor, port 6543) | Server Actions, Drizzle     | GitHub Secrets (production), Vercel Env |
| `TEST_DATABASE_URL`             | Isolated test database                                   | `ci.yml` E2E tests          | GitHub Secrets                          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (public)                            | Client-side Supabase init   | GitHub Secrets, Vercel Env              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                                 | Client-side Supabase init   | GitHub Secrets, Vercel Env              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase admin key (server only)                         | Migration scripts           | GitHub Secrets (production only)        |
| `UPSTASH_REDIS_REST_URL`        | Upstash Redis endpoint                                   | Rate limiting               | GitHub Secrets, Vercel Env              |
| `UPSTASH_REDIS_REST_TOKEN`      | Upstash Redis auth token                                 | Rate limiting               | GitHub Secrets, Vercel Env              |
| `VERCEL_TOKEN`                  | Vercel API token for deployments                         | `deploy.yml`                | GitHub Secrets                          |
| `SENTRY_DSN`                    | Sentry error reporting endpoint                          | Client + Server Sentry init | GitHub Secrets, Vercel Env              |
| `TURBO_TOKEN`                   | Turborepo remote caching token                           | `ci.yml` build cache        | GitHub Secrets                          |

### Environment Tiers

| Environment     | Branch / Trigger | Secrets Source                                 |
| --------------- | ---------------- | ---------------------------------------------- |
| **Development** | Local machine    | `.env.local` (never committed)                 |
| **Preview**     | Any PR branch    | Vercel Preview Environment                     |
| **Production**  | `main` branch    | Vercel Production Environment + GitHub Secrets |

---

## 11. Complete DevOps Flow Diagram

```
Developer machine
    │
    ├── git checkout -b feat/xyz
    ├── code → commit (conventional commits)
    └── git push
         │
         ▼
    GitHub Pull Request
         │
         ├── CI Quality Gate (ci.yml)
         │   ├── ESLint + Prettier ✅
         │   ├── TypeScript strict ✅
         │   ├── Drizzle migration check ✅
         │   └── Playwright E2E ✅
         │
         ├── Vercel Preview Deploy 🔗
         │
         └── Squash Merge → main
              │
              ├── Vercel Production Deploy 🚀
              ├── Migration (if changed) 🗄️
              └── git tag v0.X.0 → GitHub Release 📦
```

---

## 12. Monitoring & Alerting Rules

The following alerts are configured across Sentry, Vercel, Supabase, and GitHub to detect production issues early:

| Alert                          | Trigger                             | Channel                 |
| ------------------------------ | ----------------------------------- | ----------------------- |
| Error spike                    | > 10 Sentry errors in 5 minutes     | Email / Discord webhook |
| Database connection exhaustion | Supabase dashboard > 80% pool usage | Email                   |
| Serverless function timeout    | Vercel function exceeds 10s         | Sentry + Vercel alerts  |
| Rate limit spike               | Unusual Upstash blocking patterns   | Discord webhook         |
| Build failure on main          | GitHub Actions CI fails after merge | GitHub notification     |
| Lighthouse regression          | Performance score drops below 85    | GitHub PR comment       |

### Alert Setup Checklist

- [ ] Configure Sentry alert rule: "10+ errors in 5 minutes" → email + Discord
- [ ] Enable Supabase database connection usage alerts in project settings
- [ ] Enable Vercel function timeout alerts in the Vercel dashboard
- [ ] Set up Upstash monitoring dashboard and Discord webhook for rate limit spikes
- [ ] GitHub Actions failure notifications are on by default for the repo owner

---

## 13. Dependency Audit in CI

Add the `pnpm audit --audit-level=high` step to the CI pipeline to catch known vulnerabilities in dependencies before they reach production:

```yaml
dependency-audit:
  name: Dependency Security Audit
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm audit --audit-level=high
```

See `SECURITY.md` §6 for the full dependency auditing strategy.
