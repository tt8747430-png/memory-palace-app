# Roadmap — Memory Palace App

## Comprehensive Step-by-Step Implementation Guide

> **From first `git init` to production `v1.0.0` and beyond.**
> This document replaces the high-level overview with **11 granular phases**, each broken into daily sub-phases with numbered steps. Every step includes the exact command, file path, test to write, expected outcome, and cross-reference to the relevant documentation.

### How to Read This Document

Each step follows this format:

| Icon | Meaning                                                                     |
| ---- | --------------------------------------------------------------------------- |
| 🔧   | **Command** — exact shell command to run                                    |
| 📁   | **File** — exact file path to create or edit                                |
| ✅   | **Test** — which testing layer, what to assert                              |
| 🎯   | **Outcome** — what you should see when done                                 |
| 📖   | **Docs ref** — cross-link to ARCHITECTURE.md, SECURITY.md, TESTING.md, etc. |

---

## Current Progress (updated 2026-05-04)

| Phase                     | Status          | Notes                                                    |
| ------------------------- | --------------- | -------------------------------------------------------- |
| **1** Foundation & DevOps | ✅ **Complete** | Monorepo, Supabase auth, CI/CD, git hooks, Vercel config |
| **2A** Layout Components  | ✅ **Complete** | DashboardShell, Sidebar, BottomNav, MobileDrawer + tests |
| **2B** Theme System       | ⬜ Not started  | next-themes dark/light mode                              |
| **2C** Base Components    | 🔶 Partial      | Button, Sheet, Skeleton in packages/ui                   |
| **3–11**                  | ⬜ Not started  | —                                                        |

---

## Overview

| Phase  | Title                       | Timeline    | Sub-Phases                                                                                                         |
| ------ | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| **1**  | Foundation & DevOps         | Week 1      | 1A: Monorepo Scaffold · 1B: Auth & DB · 1C: CI/CD & Deploy                                                         |
| **2**  | Responsive Shell & Theming  | Week 2      | 2A: Layout Components · 2B: Theme System · 2C: Base Components                                                     |
| **3**  | Data Layer & Security       | Weeks 3–4   | 3A: DB Schema & Migrations · 3B: RLS & Server Actions · 3C: Rate Limiting & Search                                 |
| **4**  | Dashboard & Core Pages      | Weeks 5–6   | 4A: Dashboard Home · 4B: Palace/Room CRUD · 4C: Settings & Profile                                                 |
| **5**  | Spatial Canvas              | Weeks 7–9   | 5A: React Flow Setup · 5B: Drag & Persistence · 5C: Realtime Sync & Offline · 5D: Advanced Canvas UX               |
| **6**  | Command Palette & Shortcuts | Week 10     | kbar, 20+ shortcuts, `?` overlay, mobile trigger                                                                   |
| **7**  | Animations & Polish         | Week 11     | framer-motion, canvas-confetti, reduced-motion                                                                     |
| **8**  | Production Readiness        | Week 12     | 8A: Observability · 8B: A11y & SEO · 8C: Public Pages · 8D: Security Hardening · 8E: Launch Checklist → **v1.0.0** |
| **9**  | Gamification & Engagement   | Weeks 13–16 | 9A: Daily Review · 9B: Spaced Repetition · 9C: Games · 9D: Points/Badges · 9E: Review Generator                    |
| **10** | Backlinks & Knowledge Graph | Weeks 17–18 | `[[references]]`, orphan detection, connection strength                                                            |
| **11** | 3D Canvas                   | Post-v1.5.0 | React Three Fiber, WebXR stretch goal                                                                              |

### Version Tags

| Tag      | Phase             | Meaning                             |
| -------- | ----------------- | ----------------------------------- |
| `v0.1.0` | Phase 1 complete  | Infrastructure skeleton, auth works |
| `v0.2.0` | Phase 3 complete  | Data core, CRUD, search, RLS        |
| `v0.3.0` | Phase 5 complete  | Spatial canvas, realtime, offline   |
| `v0.4.0` | Phase 6 complete  | Command palette, shortcuts          |
| `v0.5.0` | Phase 7 complete  | Animations, micro-interactions      |
| `v1.0.0` | Phase 8 complete  | Production-ready launch             |
| `v1.5.0` | Phase 9 complete  | Gamification & engagement           |
| `v2.0.0` | Phase 11 complete | 3D canvas                           |

---

## Phase 1: Foundation & DevOps (Week 1)

**Goal:** Stand up the full monorepo, prove that a user can authenticate, and establish the CI/CD pipeline.

---

### Phase 1A: Monorepo Scaffold (Day 1–2)

#### Step 1.A.1 — Initialize the Turborepo monorepo

🔧 **Command:**

```bash
pnpx create-turbo@latest memory-palace-app --package-manager pnpm
cd memory-palace-app
```

📁 **Files created:**

```
memory-palace-app/
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── apps/
│   └── web/               # Next.js app (auto-generated)
└── packages/
```

🎯 **Outcome:** Running `pnpm dev` starts the default Turborepo starter. The root `turbo.json` exists with a basic pipeline.

📖 **Docs ref:** [ARCHITECTURE.md §4 — Monorepo File Structure](./ARCHITECTURE.md#4-monorepo-file-structure)

---

#### Step 1.A.2 — Configure pnpm workspace

🔧 **Command:**

```bash
# Edit pnpm-workspace.yaml
```

📁 **File:** `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

📁 **File:** `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test:unit": {
      "dependsOn": [],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

🎯 **Outcome:** `pnpm install` resolves workspace dependencies. `pnpm turbo build` builds all packages in dependency order.

📖 **Docs ref:** [TESTING.md §3 — Turborepo Pipeline Scripts](./TESTING.md#3-unit-tests-vitest)

---

#### Step 1.A.3 — Create Next.js App Router in `apps/web`

🔧 **Command:**

```bash
rm -rf apps/web
pnpx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

📁 **Files created:**

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── ...
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

✅ **Test:** Run `pnpm --filter web dev` — the Next.js welcome page renders at `http://localhost:3000`.

🎯 **Outcome:** A clean Next.js 14+ App Router application with TypeScript, Tailwind CSS, and `src/` directory.

📖 **Docs ref:** [ARCHITECTURE.md §1 — Technology Stack](./ARCHITECTURE.md#1-technology-stack)

---

#### Step 1.A.4 — Create `packages/db` (Drizzle ORM)

🔧 **Command:**

```bash
mkdir -p packages/db/src packages/db/migrations
cd packages/db
pnpm init
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit typescript @types/node
cd ../..
```

📁 **File:** `packages/db/package.json`

```json
{
  "name": "@memory-palace/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "push": "drizzle-kit push",
    "studio": "drizzle-kit studio",
    "test:unit": "vitest run --reporter=verbose"
  },
  "dependencies": {
    "drizzle-orm": "^0.35.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0"
  }
}
```

📁 **File:** `packages/db/src/client.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// ✅ CORRECT: pooled connection via Supavisor (port 6543)
const sql = postgres(process.env.DATABASE_URL!);

export const db = drizzle(sql);
```

📁 **File:** `packages/db/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

🎯 **Outcome:** `@memory-palace/db` is importable from `apps/web`. Drizzle is configured and ready for schema definition.

📖 **Docs ref:** [ARCHITECTURE.md §5.A — Database Connection Pooling](./ARCHITECTURE.md#5-critical-implementation-details)

---

#### Step 1.A.5 — Create `packages/ui` (shadcn/ui base)

🔧 **Command:**

```bash
mkdir -p packages/ui/src/components
cd packages/ui
pnpm init
cd ../..
pnpm add -D tailwindcss @tailwindcss/typography --filter @memory-palace/ui
```

📁 **File:** `packages/ui/package.json`

```json
{
  "name": "@memory-palace/ui",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

📁 **File:** `packages/ui/src/index.ts`

```typescript
// Barrel export for all UI components
export { Button } from './components/button';
export { Skeleton } from './components/skeleton';
// Add more as components are created
```

🎯 **Outcome:** `@memory-palace/ui` package exists. shadcn/ui components will be initialized into this package.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §6 — Component Patterns](./UI_STYLE_GUIDE.md#6-component-patterns)

---

#### Step 1.A.6 — Create `packages/eslint-config` and `packages/typescript-config`

🔧 **Command:**

```bash
mkdir -p packages/eslint-config packages/typescript-config
```

📁 **File:** `packages/eslint-config/package.json`

```json
{
  "name": "@memory-palace/eslint-config",
  "version": "0.0.1",
  "main": "index.js"
}
```

📁 **File:** `packages/eslint-config/index.js`

```javascript
module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'apps/*' },
      { type: 'package', pattern: 'packages/*' },
    ],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'app', allow: ['package'] },
          { from: 'package', allow: ['package'] },
        ],
      },
    ],
  },
};
```

📁 **File:** `packages/typescript-config/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "incremental": true
  }
}
```

🔧 **Command:**

```bash
pnpm add -D eslint-plugin-boundaries --filter @memory-palace/eslint-config
```

🎯 **Outcome:** Shared ESLint and TypeScript configs available across all workspaces. Boundary rules enforce monorepo package isolation.

📖 **Docs ref:** [ARCHITECTURE.md §7 — Guiding Principles](./ARCHITECTURE.md#7-guiding-principles)

---

#### Step 1.A.7 — Create `.env.example` and environment structure

📁 **File:** `.env.example`

```bash
# ────── Supabase ──────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ✅ Pooled (Supavisor) — use this everywhere in serverless
DATABASE_URL=postgresql://postgres.<ref>:<password>@db.pooler.supabase.com:6543/postgres

# ❌ Direct — only for migrations from a long-lived process
# DIRECT_DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.com:5432/postgres

# ────── Upstash Redis (Rate Limiting) ──────
UPSTASH_REDIS_REST_URL=https://your-upstash.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# ────── Sentry ──────
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# ────── Vercel ──────
VERCEL_TOKEN=your-vercel-token

# ────── Turborepo ──────
TURBO_TOKEN=your-turbo-token

# ────── Test DB (CI only) ──────
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db
```

📁 **File:** `.gitignore` (add to existing)

```
.env.local
.env.*.local
```

🎯 **Outcome:** Every required environment variable is documented. New developers copy `.env.example` to `.env.local` and fill in their values.

📖 **Docs ref:** [DEVELOPMENT.md §10 — Secrets & Environment Management](./DEVELOPMENT.md#10-secrets--environment-management), [SECURITY.md §5 — Supabase Service Role Key Policy](./SECURITY.md#5-supabase-service-role-key-policy)

---

### Phase 1B: Auth & Database Setup (Day 3–4)

#### Step 1.B.1 — Create Supabase project

🔧 **Command:**

```bash
# Via Supabase Dashboard (https://app.supabase.com)
# 1. Create a new project (free tier)
# 2. Copy: Project URL, Anon Key, Service Role Key, Database URL (pooled)
# 3. Paste into .env.local
```

📁 **File:** `apps/web/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres.xxxxx:password@db.pooler.supabase.com:6543/postgres
```

✅ **Test:** Visit the Supabase dashboard and confirm the project is online, the database is accessible, and Auth is enabled.

🎯 **Outcome:** Supabase project exists. The pooled connection URL is stored in `.env.local`.

📖 **Docs ref:** [ARCHITECTURE.md §5.A — Database Connection Pooling](./ARCHITECTURE.md#5-critical-implementation-details)

---

#### Step 1.B.2 — Set up local Supabase via Docker

🔧 **Command:**

```bash
pnpm add -D supabase --filter web
npx supabase init
npx supabase start
```

📁 **Files created:**

```
supabase/
├── config.toml
├── seed.sql
└── migrations/
```

🎯 **Outcome:** Running `npx supabase start` starts local Supabase (PostgreSQL, Auth, Storage, Realtime) in Docker. Local development does not depend on the remote Supabase project.

📖 **Docs ref:** [DEVELOPMENT.md §10 — Environment Tiers](./DEVELOPMENT.md#10-secrets--environment-management)

---

#### Step 1.B.3 — Install and configure Supabase Auth with `@supabase/ssr`

🔧 **Command:**

```bash
pnpm add @supabase/supabase-js @supabase/ssr --filter web
```

📁 **File:** `apps/web/src/shared/lib/supabase-server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}

export async function auth() {
  const supabase = createSupabaseServer();
  return supabase.auth.getUser();
}
```

📁 **File:** `apps/web/src/shared/lib/supabase-browser.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

📁 **File:** `apps/web/src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/about') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

🎯 **Outcome:** Supabase Auth is configured for cookie-based SSR. The middleware redirects unauthenticated users to `/login`. Public pages (`/`, `/about`) are accessible without auth.

📖 **Docs ref:** [ARCHITECTURE.md §1 — Technology Stack](./ARCHITECTURE.md#1-technology-stack), [SECURITY.md §7 — Rate Limiting Layer 1](./SECURITY.md#7-rate-limiting-layers)

---

#### Step 1.B.4 — Create Login and Signup pages

📁 **File:** `apps/web/src/app/(auth)/login/page.tsx`

```typescript
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-mobile-h1 md:text-4xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your Memory Palace</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

📁 **File:** `apps/web/src/app/(auth)/signup/page.tsx`

```typescript
import { SignupForm } from '@/features/auth/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-mobile-h1 md:text-4xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">Start building your Memory Palace</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
```

📁 **File:** `apps/web/src/features/auth/components/LoginForm.tsx`

```typescript
'use client';
import { createSupabaseBrowser } from '@/shared/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@memory-palace/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)} required
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px]" />
      <input type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)} required
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px]" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full min-h-[48px]" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}
```

✅ **Test (Component):** `LoginForm` renders email/password inputs, shows error on invalid credentials, calls `signInWithPassword`.

🎯 **Outcome:** Users can navigate to `/login` and `/signup`, enter credentials, and authenticate via Supabase.

📖 **Docs ref:** [TESTING.md §4 — Component Tests](./TESTING.md#4-component-tests-vitest--react-testing-library)

---

#### Step 1.B.5 — Install `next-intl` for i18n readiness

🔧 **Command:**

```bash
pnpm add next-intl --filter web
```

📁 **File:** `apps/web/messages/en.json`

```json
{
  "common": {
    "appName": "Memory Palace",
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "loading": "Loading…"
  },
  "dashboard": {
    "welcome": "Good morning, {name} 👋",
    "emptyPalaces": "Build your first Memory Palace"
  }
}
```

🎯 **Outcome:** i18n is initialized. All user-facing strings can be replaced with translation keys as needed.

---

### Phase 1C: CI/CD & Deploy (Day 5–7)

#### Step 1.C.1 — Create GitHub Actions CI pipeline

📁 **File:** `.github/workflows/ci.yml`

```yaml
name: CI Quality Gate

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: ESLint + Prettier
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint

  typecheck:
    name: TypeScript Strict
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck

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

  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo test:unit

  test-e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm turbo build --filter=web
      - run: pnpm exec playwright test
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
```

✅ **Test:** Push a branch, open a PR — all CI jobs appear in the PR checks.

🎯 **Outcome:** Every PR runs lint, typecheck, security audit, unit tests, and E2E tests before merge.

📖 **Docs ref:** [DEVELOPMENT.md §5 — GitHub Actions CI/CD Pipeline](./DEVELOPMENT.md#5-github-actions-cicd-pipeline), [DEVELOPMENT.md §13 — Dependency Audit in CI](./DEVELOPMENT.md#13-dependency-audit-in-ci)

---

#### Step 1.C.2 — Create Vercel deploy workflow

📁 **File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    name: Vercel Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

🎯 **Outcome:** PRs get preview deploys. Merges to `main` trigger production deploys.

📖 **Docs ref:** [DEVELOPMENT.md §5.B — deploy.yml](./DEVELOPMENT.md#5-github-actions-cicd-pipeline)

---

#### Step 1.C.3 — Create database migration workflow

📁 **File:** `.github/workflows/migrate.yml`

```yaml
name: Database Migration

on:
  push:
    branches: [main]
    paths:
      - 'packages/db/migrations/**'

jobs:
  migrate:
    name: Run Drizzle Migrations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @memory-palace/db migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

🎯 **Outcome:** Migrations run automatically when migration files change on `main`.

📖 **Docs ref:** [DEVELOPMENT.md §5.C — migrate.yml](./DEVELOPMENT.md#5-github-actions-cicd-pipeline)

---

#### Step 1.C.4 — Create release workflow with `git-cliff`

🔧 **Command:**

```bash
pnpm add -D git-cliff -w
```

📁 **File:** `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    name: GitHub Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: orhun/git-cliff-action@v4
        id: cliff
        with:
          config: cliff.toml
          args: --latest --strip header
      - uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.cliff.outputs.content }}
```

✅ **Test:** Create a tag `git tag -a v0.0.1 -m "test release" && git push origin v0.0.1` — a GitHub Release is created with a changelog.

🎯 **Outcome:** Tagging a version auto-generates a changelog and creates a GitHub Release.

📖 **Docs ref:** [DEVELOPMENT.md §3 — Release & Tagging Strategy](./DEVELOPMENT.md#3-release--tagging-strategy)

---

#### Step 1.C.5 — Configure branch protection rules

🔧 **Command (GitHub CLI):**

```bash
# Via GitHub Settings → Branches → Branch protection rules → main
```

| Rule                        | Setting                                      |
| --------------------------- | -------------------------------------------- |
| Require PR before merging   | ✅                                           |
| Required status checks      | `lint`, `typecheck`, `test-unit`, `test-e2e` |
| Require up-to-date branches | ✅                                           |
| Merge method                | Squash only                                  |
| Delete head branches        | ✅                                           |
| Force pushes                | ❌                                           |

🎯 **Outcome:** Direct pushes to `main` are blocked. All changes go through reviewed PRs.

📖 **Docs ref:** [DEVELOPMENT.md §6 — Branch Protection Rules](./DEVELOPMENT.md#6-branch-protection-rules-for-main)

---

### Phase 1 — Release Tag: `v0.1.0`

```bash
git tag -a v0.1.0 -m "Phase 1: Infrastructure Skeleton"
git push origin v0.1.0
```

> **Deliverable:** User can sign up, log in, and see a blank page. Monorepo is structured. CI passes on every PR. Vercel deploys on merge.

---

## Phase 2: Responsive Shell & Theming (Week 2)

**Goal:** Build the mobile-first responsive layout shell with dark/light theming.

---

### Phase 2A: Layout Components (Day 1–3)

#### Step 2.A.1 — Create the `DashboardShell` component

📁 **File:** `apps/web/src/features/dashboard/components/DashboardShell.tsx`

```typescript
'use client';
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-[100dvh] flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r">
        <Sidebar />
      </aside>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        <MobileDrawer />
        <h1 className="text-lg font-semibold">Memory Palace</h1>
        <button className="rounded-full p-2 min-w-[48px] min-h-[48px]">🔔</button>
      </header>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        <BottomNav />
      </nav>
    </div>
  );
}
```

✅ **Test (Component):** `DashboardShell` renders sidebar on desktop viewport, bottom nav on mobile viewport.

🎯 **Outcome:** The shell renders correctly at all breakpoints. Content scrolls above bottom nav on mobile.

📖 **Docs ref:** [ARCHITECTURE.md §8 — Responsive Layout Architecture](./ARCHITECTURE.md#8-responsive-layout-architecture), [UI_STYLE_GUIDE.md §1 — Mobile-First Design Strategy](./UI_STYLE_GUIDE.md#1-mobile-first-design-strategy)

---

#### Step 2.A.2 — Create the `BottomNav` component

📁 **File:** `apps/web/src/features/dashboard/components/BottomNav.tsx`

```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Gamepad2, Trophy, Map } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const tabs = [
  { href: '/',         icon: Home,      label: 'Home' },
  { href: '/daily',    icon: Calendar,  label: 'Daily' },
  { href: '/games',    icon: Gamepad2,  label: 'Games' },
  { href: '/progress', icon: Trophy,    label: 'Progress' },
  { href: '/palace',   icon: Map,       label: 'Palaces' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="flex h-16 items-center justify-around">
      {tabs.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-2',
              'min-w-[48px] min-h-[48px]',
              'transition-colors duration-150',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[0.625rem] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
```

✅ **Test (Component):** `BottomNav` renders 5 tabs. Active tab has `text-primary` class. Touch targets are ≥ 48px.

🎯 **Outcome:** Five-tab bottom navigation bar on mobile with 48px minimum touch targets.

📖 **Docs ref:** [ARCHITECTURE.md §8 — BottomNav.tsx](./ARCHITECTURE.md#8-responsive-layout-architecture), [UI_STYLE_GUIDE.md §1 — Bottom Navigation](./UI_STYLE_GUIDE.md#1-mobile-first-design-strategy)

---

#### Step 2.A.3 — Create `Sidebar` and `MobileDrawer` components

📁 **File:** `apps/web/src/features/dashboard/components/Sidebar.tsx`

```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Map, Gamepad2, Trophy, BookOpen, FileText, Search, Settings, User } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const items = [
  { href: '/',         icon: Home,      label: 'Home' },
  { href: '/daily',    icon: Calendar,  label: 'Daily Review' },
  { href: '/palace',   icon: Map,       label: 'Palaces' },
  { href: '/games',    icon: Gamepad2,  label: 'Games' },
  { href: '/progress', icon: Trophy,    label: 'Progress' },
  { href: '/study',    icon: BookOpen,  label: 'Study' },
  { href: '/review',   icon: FileText,  label: 'Review Generator' },
  { href: '/search',   icon: Search,    label: 'Settings' },
  { href: '/settings', icon: Settings,  label: 'Settings' },
  { href: '/profile',  icon: User,      label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-4 h-full">
      <div className="text-xl font-bold mb-6 px-2">🏛️ Memory Palace</div>
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive ? 'bg-muted text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

📁 **File:** `apps/web/src/features/dashboard/components/MobileDrawer.tsx`

```typescript
'use client';
import { Sheet, SheetContent, SheetTrigger } from '@memory-palace/ui';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-full p-2 min-w-[48px] min-h-[48px]">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
```

📁 **File:** `apps/web/src/features/dashboard/index.ts`

```typescript
export { DashboardShell } from './components/DashboardShell';
export { BottomNav } from './components/BottomNav';
export { Sidebar } from './components/Sidebar';
export { MobileDrawer } from './components/MobileDrawer';
```

🎯 **Outcome:** Desktop shows a 256px sidebar. Mobile shows hamburger menu that slides a `Sheet` from the left.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §7 — Responsive Navigation Architecture](./UI_STYLE_GUIDE.md#7-responsive-navigation-architecture)

---

#### Step 2.A.4 — Create dashboard layout wrapper

📁 **File:** `apps/web/src/app/(dashboard)/layout.tsx`

```typescript
import { DashboardShell } from '@/features/dashboard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

📁 **File:** `apps/web/src/app/(dashboard)/page.tsx`

```typescript
export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="text-mobile-h1 md:text-4xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome to your Memory Palace.</p>
    </div>
  );
}
```

✅ **Test (E2E):** Navigate to `/` after login — `DashboardShell` renders with sidebar on desktop, bottom nav on mobile.

🎯 **Outcome:** All dashboard pages inherit the responsive shell layout.

📖 **Docs ref:** [ARCHITECTURE.md §8 — (dashboard)/layout.tsx](./ARCHITECTURE.md#8-responsive-layout-architecture)

---

#### Step 2.A.5 — Configure viewport meta tag and safe area CSS

📁 **File:** `apps/web/src/app/layout.tsx` (edit the root layout)

```typescript
import type { Viewport, Metadata } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Memory Palace',
  description: 'Build and review your Memory Palace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

🎯 **Outcome:** `viewport-fit=cover` is set. iOS devices render edge-to-edge, and `env(safe-area-inset-*)` values work correctly.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §1 — Viewport Meta Tag](./UI_STYLE_GUIDE.md#1-mobile-first-design-strategy)

---

### Phase 2B: Theme System (Day 4–5)

#### Step 2.B.1 — Install and configure `next-themes`

🔧 **Command:**

```bash
pnpm add next-themes --filter web
```

📁 **File:** `apps/web/src/app/layout.tsx` (update)

```typescript
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

📁 **File:** `apps/web/src/app/globals.css` (add color tokens)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 98%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 220 90% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 220 9% 46%;
    --muted: 220 14% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 262 83% 58%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 220 90% 56%;
    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 10%;
    --surface: 0 0% 98%;
    --surface-foreground: 240 10% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 20% 7%;
    --foreground: 210 40% 96%;
    --card: 222 15% 12%;
    --card-foreground: 210 40% 96%;
    --popover: 222 15% 15%;
    --popover-foreground: 210 40% 96%;
    --primary: 220 90% 65%;
    --primary-foreground: 0 0% 100%;
    --secondary: 222 15% 15%;
    --secondary-foreground: 215 20% 65%;
    --muted: 222 15% 15%;
    --muted-foreground: 215 20% 65%;
    --accent: 262 83% 70%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 222 15% 18%;
    --input: 222 15% 18%;
    --ring: 220 90% 65%;
    --success: 142 76% 50%;
    --warning: 38 92% 60%;
    --surface: 240 10% 10%;
    --radius: 0.5rem;
  }
}
```

🎯 **Outcome:** Dark/light mode toggles based on OS preference by default. CSS custom properties switch automatically.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §3 — Color & Theme System](./UI_STYLE_GUIDE.md#3-color--theme-system), [UI_STYLE_GUIDE.md §10 — Dark Mode Best Practices](./UI_STYLE_GUIDE.md#10-dark-mode-best-practices)

---

#### Step 2.B.2 — Create `ThemeToggle` component

📁 **File:** `apps/web/src/shared/components/ThemeToggle.tsx`

```typescript
'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-muted"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
```

🎯 **Outcome:** A theme toggle button is available in the header and sidebar.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §10 — Dark Mode Toggle](./UI_STYLE_GUIDE.md#10-dark-mode-best-practices)

---

#### Step 2.B.3 — Configure Tailwind with custom extensions

📁 **File:** `apps/web/tailwind.config.ts` (extend)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      fontSize: {
        'mobile-h1': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'mobile-h2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'mobile-body': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'mobile-caption': ['0.75rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      },
      height: {
        'bottom-nav': '4rem',
        'top-bar': '3.5rem',
        'screen-dynamic': '100dvh',
      },
      minWidth: { touch: '48px' },
      minHeight: { touch: '48px' },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```

🎯 **Outcome:** Tailwind is extended with safe area spacing, mobile typography scale, touch target utilities, and semantic color tokens.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §4 — Tailwind Config Additions](./UI_STYLE_GUIDE.md#4-tailwind-config-additions)

---

### Phase 2C: Base Components (Day 5–7)

#### Step 2.C.1 — Create `EmptyState` component

📁 **File:** `apps/web/src/shared/components/EmptyState.tsx`

```typescript
import { Button } from '@memory-palace/ui';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && (
        <Button className="w-full md:w-auto" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

🎯 **Outcome:** Reusable empty state component available for all list views.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §12 — Empty States](./UI_STYLE_GUIDE.md#12-empty-states)

---

#### Step 2.C.2 — Create skeleton loading components

📁 **File:** `apps/web/src/shared/components/PalaceCardSkeleton.tsx`

```typescript
import { Skeleton } from '@memory-palace/ui';

export function PalaceCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
```

🎯 **Outcome:** Skeleton cards render while data is loading, preventing layout shift.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §6 — Skeleton Loading States](./UI_STYLE_GUIDE.md#6-component-patterns)

---

#### Step 2.C.3 — Create `cn()` utility

📁 **File:** `apps/web/src/shared/utils/cn.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

🔧 **Command:**

```bash
pnpm add clsx tailwind-merge --filter web
```

🎯 **Outcome:** `cn()` utility merges Tailwind classes without conflicts.

---

## Phase 3: Data Layer & Security (Weeks 3–4)

**Goal:** Build the complete database schema, Row Level Security, Server Actions with validation, rate limiting, and full-text search.

---

### Phase 3A: DB Schema & Migrations (Day 1–3)

#### Step 3.A.1 — Define the Drizzle ORM schema

📁 **File:** `packages/db/src/schema.ts`

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamptz,
  float8,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
});

export const palaces = pgTable(
  'palaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    description: text('description'),
    deletedAt: timestamptz('deleted_at'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_palaces_user_id').on(table.userId),
  }),
);

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    palaceId: uuid('palace_id')
      .notNull()
      .references(() => palaces.id),
    name: text('name').notNull(),
    bgImageUrl: text('bg_image_url'),
    width: integer('width'),
    height: integer('height'),
    order: integer('order'),
    deletedAt: timestamptz('deleted_at'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    palaceIdIdx: index('idx_rooms_palace_id').on(table.palaceId),
  }),
);

export const nodes = pgTable(
  'nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    content: text('content'),
    positionX: float8('position_x'),
    positionY: float8('position_y'),
    positionZ: float8('position_z'),
    nodeType: text('node_type').default('text'),
    deletedAt: timestamptz('deleted_at'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    roomIdIdx: index('idx_nodes_room_id').on(table.roomId),
    userIdIdx: index('idx_nodes_user_id').on(table.userId),
  }),
);

export const edges = pgTable(
  'edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceNodeId: uuid('source_node_id')
      .notNull()
      .references(() => nodes.id),
    targetNodeId: uuid('target_node_id')
      .notNull()
      .references(() => nodes.id),
    label: text('label'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sourceTargetIdx: index('idx_edges_source_target').on(table.sourceNodeId, table.targetNodeId),
  }),
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    userIdIdx: index('idx_tags_user_id').on(table.userId),
  }),
);

export const nodeTags = pgTable(
  'node_tags',
  {
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.nodeId, table.tagId] }),
  }),
);
```

📁 **File:** `packages/db/src/index.ts`

```typescript
export { db } from './client';
export * from './schema';
```

✅ **Test (Unit):** Schema exports all tables. Column types are correct.

🎯 **Outcome:** Complete database schema defined with all tables, indexes, and relationships from Day 1.

📖 **Docs ref:** [ARCHITECTURE.md §3 — Relational Database Schema](./ARCHITECTURE.md#3-relational-database-schema), [ARCHITECTURE.md §7 — "Indexes from Day 1"](./ARCHITECTURE.md#7-guiding-principles)

---

#### Step 3.A.2 — Generate and run the first migration

🔧 **Command:**

```bash
cd packages/db
pnpm generate
pnpm migrate
cd ../..
```

🎯 **Outcome:** `packages/db/migrations/` contains the first SQL migration file. Tables are created in the database.

---

#### Step 3.A.3 — Add the GIN full-text search index

🔧 **Command:** Create a manual SQL migration file:

📁 **File:** `packages/db/migrations/0002_add_fts_index.sql`

```sql
CREATE INDEX idx_nodes_content_fts
ON nodes
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
```

🔧 **Command:**

```bash
pnpm --filter @memory-palace/db migrate
```

🎯 **Outcome:** Full-text search index exists on `nodes` table, enabling sub-millisecond search.

📖 **Docs ref:** [ARCHITECTURE.md §3 — Full-Text Search Index](./ARCHITECTURE.md#3-relational-database-schema), [ARCHITECTURE.md §5.D — Full-Text Search](./ARCHITECTURE.md#5-critical-implementation-details)

---

### Phase 3B: RLS & Server Actions (Day 4–7)

#### Step 3.B.1 — Create Row Level Security policies

📁 **File:** `packages/db/migrations/0003_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE palaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_tags ENABLE ROW LEVEL SECURITY;

-- Palaces: users own their palaces
CREATE POLICY "Users can only access their own palaces"
ON palaces FOR ALL USING (auth.uid() = user_id);

-- Rooms: access via palace ownership
CREATE POLICY "Users can only access rooms in their palaces"
ON rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM palaces p WHERE p.id = rooms.palace_id AND p.user_id = auth.uid())
);

-- Nodes: access via room → palace chain
CREATE POLICY "Users can only access nodes in their rooms"
ON nodes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM rooms r JOIN palaces p ON r.palace_id = p.id
    WHERE r.id = nodes.room_id AND p.user_id = auth.uid()
  )
);

-- Edges: access via connected nodes
CREATE POLICY "Users can only access edges between their nodes"
ON edges FOR ALL USING (
  EXISTS (
    SELECT 1 FROM nodes n JOIN rooms r ON n.room_id = r.id JOIN palaces p ON r.palace_id = p.id
    WHERE (n.id = edges.source_node_id OR n.id = edges.target_node_id) AND p.user_id = auth.uid()
  )
);

-- Tags: users own their tags
CREATE POLICY "Users can only access their own tags"
ON tags FOR ALL USING (auth.uid() = user_id);
```

✅ **Test (Integration):** User A creates a palace. User B cannot read it. Verified via integration tests against a real DB.

🎯 **Outcome:** All tables have RLS enabled. Data is isolated per user at the database level.

📖 **Docs ref:** [ARCHITECTURE.md §3 — Row Level Security (RLS)](./ARCHITECTURE.md#3-relational-database-schema), [SECURITY.md §5 — Supabase Service Role Key Policy](./SECURITY.md#5-supabase-service-role-key-policy)

---

#### Step 3.B.2 — Create Zod validation schemas

📁 **File:** `apps/web/src/features/memory-nodes/schemas.ts`

```typescript
import { z } from 'zod';

export const createPalaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const createRoomSchema = z.object({
  palaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const createNodeSchema = z.object({
  roomId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().max(5000).optional(),
  positionX: z.number().finite(),
  positionY: z.number().finite(),
  nodeType: z.enum(['text', 'image', 'link']).default('text'),
});

export const nodePositionSchema = z.object({
  x: z.number().finite().min(-10000).max(10000),
  y: z.number().finite().min(-10000).max(10000),
});

export const batchUpdateSchema = z.object({
  roomId: z.string().uuid(),
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        position_x: z.number().finite(),
        position_y: z.number().finite(),
      }),
    )
    .min(1)
    .max(100),
});
```

✅ **Test (Unit):** Every schema tested with valid, invalid, and edge case payloads (NaN, Infinity, empty strings, excessively long strings).

🎯 **Outcome:** All input shapes are validated before any database operation.

📖 **Docs ref:** [TESTING.md §3 — Unit Tests: Zod schemas](./TESTING.md#3-unit-tests-vitest), [ARCHITECTURE.md §7 — "Trust no client"](./ARCHITECTURE.md#7-guiding-principles)

---

#### Step 3.B.3 — Create Server Actions for Palace CRUD

📁 **File:** `apps/web/src/features/memory-nodes/actions/createPalace.ts`

```typescript
'use server';

import { db } from '@memory-palace/db';
import { palaces } from '@memory-palace/db/schema';
import { createPalaceSchema } from '../schemas';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { auth } from '@/shared/lib/supabase-server';
import type { ActionResponse } from '@/shared/types';

export async function createPalace(
  input: unknown,
): Promise<ActionResponse<typeof palaces.$inferSelect>> {
  try {
    const {
      data: { user },
    } = await auth();
    if (!user)
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };

    await checkRateLimit();

    const parsed = createPalaceSchema.safeParse(input);
    if (!parsed.success)
      return {
        success: false,
        error: { code: 'VALIDATION_FAILED', message: parsed.error.message },
      };

    const [palace] = await db
      .insert(palaces)
      .values({
        userId: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
      })
      .returning();

    return { success: true, data: palace };
  } catch (error: any) {
    if (error.status === 429)
      return { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } };
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create palace' },
    };
  }
}
```

📁 **File:** `apps/web/src/shared/types.ts`

```typescript
export type ErrorCode =
  | 'RATE_LIMITED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } };
```

✅ **Test (Integration):** `createPalace` creates with valid data, rejects invalid Zod input, rejects unauthenticated users, returns 429 after rate limit threshold.

🎯 **Outcome:** Palace CRUD Server Action with Zod validation, rate limiting, and typed error responses.

📖 **Docs ref:** [ARCHITECTURE.md §6 — Server Action Response Standard](./ARCHITECTURE.md#6-additional-architecture-decisions), [ARCHITECTURE.md §7 — "Trust no client"](./ARCHITECTURE.md#7-guiding-principles)

---

#### Step 3.B.4 — Create `batchUpdateNodes` Server Action

📁 **File:** `apps/web/src/features/spatial-canvas/actions/batchUpdateNodes.ts`

```typescript
'use server';

import { db } from '@memory-palace/db';
import { nodes } from '@memory-palace/db/schema';
import { eq } from 'drizzle-orm';
import { batchUpdateSchema } from '@/features/memory-nodes/schemas';
import { checkRateLimit } from '@/shared/lib/rate-limit';

export async function batchUpdateNodes(input: unknown) {
  const { roomId, updates } = batchUpdateSchema.parse(input);
  await checkRateLimit();

  await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx
        .update(nodes)
        .set({
          position_x: update.position_x,
          position_y: update.position_y,
          updated_at: new Date(),
        })
        .where(eq(nodes.id, update.id));
    }
  });
}
```

✅ **Test (Integration):** Updates multiple node positions in a single transaction. Rolls back if one node ID is invalid.

🎯 **Outcome:** Multi-node position saves in a single DB transaction. No per-node round-trips.

📖 **Docs ref:** [ARCHITECTURE.md §5.C — Batch Saving](./ARCHITECTURE.md#5-critical-implementation-details), [TESTING.md §5 — Integration: batchUpdateNodes](./TESTING.md#5-integration-tests-server-actions--real-database)

---

### Phase 3C: Rate Limiting & Search (Day 8–10)

#### Step 3.C.1 — Install and configure Upstash rate limiting

🔧 **Command:**

```bash
pnpm add @upstash/ratelimit @upstash/redis --filter web
```

📁 **File:** `apps/web/src/shared/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { auth } from '@/shared/lib/supabase-server';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '5 s'),
  analytics: true,
});

export async function checkRateLimit() {
  const {
    data: { user },
  } = await auth();
  if (!user) throw new Error('Unauthorized');

  const { success } = await ratelimit.limit(`user:${user.id}`);
  if (!success) {
    const error = new Error('Rate limit exceeded');
    (error as any).status = 429;
    throw error;
  }
}
```

✅ **Test (E2E):** Fire 20 rapid saves — first 10 succeed, remaining return 429.

🎯 **Outcome:** Per-user rate limiting at 10 requests per 5 seconds, checked before any DB operation.

📖 **Docs ref:** [ARCHITECTURE.md §5.F — Rate Limiting](./ARCHITECTURE.md#5-critical-implementation-details), [SECURITY.md §7 — Rate Limiting Layers](./SECURITY.md#7-rate-limiting-layers)

---

#### Step 3.C.2 — Create `searchNodes` Server Action

📁 **File:** `apps/web/src/features/search/actions/searchNodes.ts`

```typescript
'use server';

import { db } from '@memory-palace/db';
import { sql } from 'drizzle-orm';
import { auth } from '@/shared/lib/supabase-server';

export async function searchNodes(query: string) {
  const {
    data: { user },
  } = await auth();
  if (!user) throw new Error('Unauthorized');

  return db.execute(sql`
    SELECT id, title, content, room_id,
           ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')),
                   plainto_tsquery('english', ${query})) AS rank
    FROM nodes
    WHERE user_id = ${user.id}
      AND deleted_at IS NULL
      AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
          @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20
  `);
}
```

✅ **Test (Integration):** Create 5 nodes with different content → search by keyword → only matching nodes returned. Verify RLS: User A can't see User B's nodes.

🎯 **Outcome:** Full-text search across all node titles and content, with ranking and RLS isolation.

📖 **Docs ref:** [ARCHITECTURE.md §5.D — Full-Text Search](./ARCHITECTURE.md#5-critical-implementation-details)

---

#### Step 3.C.3 — Install DOMPurify for input sanitization

🔧 **Command:**

```bash
pnpm add isomorphic-dompurify --filter web
pnpm add -D @types/dompurify --filter web
```

📁 **File:** `apps/web/src/shared/lib/sanitize.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeNodeContent(content: string): string {
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'] });
}
```

✅ **Test (Unit):** XSS payloads stripped, valid HTML preserved.

🎯 **Outcome:** All user-generated content is sanitized before persistence and before rendering.

📖 **Docs ref:** [SECURITY.md §3 — Input Sanitization](./SECURITY.md#3-input-sanitization)

---

### Phase 3 — Release Tag: `v0.2.0`

```bash
git tag -a v0.2.0 -m "Phase 3: Data Core & Security"
git push origin v0.2.0
```

> **Deliverable:** Full CRUD for Palaces, Rooms, and Nodes. Search works. All data is isolated by user via RLS. Rate limiting prevents abuse. Input is sanitized.

---

## Phase 4: Dashboard & Core Pages (Weeks 5–6)

**Goal:** Build the dashboard home page with all widgets, palace/room CRUD views, and settings pages.

---

### Phase 4A: Dashboard Home (Day 1–4)

#### Step 4.A.1 — Create the Welcome Banner

📁 **File:** `apps/web/src/features/dashboard/components/WelcomeBanner.tsx`

```typescript
'use client';

interface WelcomeBannerProps {
  displayName: string;
  streak: number;
  reviewCompleted: boolean;
}

export function WelcomeBanner({ displayName, streak, reviewCompleted }: WelcomeBannerProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-mobile-h1 md:text-4xl font-bold">
        Good morning, {displayName} 👋
      </h1>
      {streak > 0 && (
        <p className="text-sm text-muted-foreground">🔥 {streak}-day streak</p>
      )}
      {!reviewCompleted && (
        <p className="text-sm text-primary">Start today&apos;s review to keep your streak alive!</p>
      )}
    </div>
  );
}
```

🎯 **Outcome:** Personalised greeting with streak count and daily review prompt.

📖 **Docs ref:** [FEATURES.md §1 — Welcome Banner](./FEATURES.md#1-dashboard-home-page)

---

#### Step 4.A.2 — Create the Quick Stats Row

📁 **File:** `apps/web/src/features/dashboard/components/QuickStatsRow.tsx`

```typescript
'use client';
import { Zap, Map, Flame, Target } from 'lucide-react';

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 min-h-[48px] shrink-0">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-mobile-caption text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function QuickStatsRow({ points, palaceCount, streak, accuracy }: { points: number; palaceCount: number; streak: number; accuracy: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0">
      <StatChip icon={<Zap className="h-4 w-4" />} value={points} label="Points" />
      <StatChip icon={<Map className="h-4 w-4" />} value={palaceCount} label="Palaces" />
      <StatChip icon={<Flame className="h-4 w-4" />} value={streak} label="Day Streak" />
      <StatChip icon={<Target className="h-4 w-4" />} value={`${accuracy}%`} label="Accuracy" />
    </div>
  );
}
```

🎯 **Outcome:** Horizontal-scrolling stats row on mobile, inline on desktop. Each chip is at least 48px tall.

📖 **Docs ref:** [FEATURES.md §1 — Quick Stats Row](./FEATURES.md#1-dashboard-home-page)

---

#### Step 4.A.3 — Create the Palace Card Grid with loading & empty states

📁 **File:** `apps/web/src/features/memory-nodes/components/PalaceCard.tsx` and `PalaceGrid.tsx`

- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Skeleton loading cards while fetching
- Empty state: 🏛️ "Build your first Memory Palace" with CTA

✅ **Test (Component):** `PalaceGrid` renders skeleton cards when loading, empty state when no palaces, and cards when palaces exist.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §6 — Card-Based Layouts](./UI_STYLE_GUIDE.md#6-component-patterns)

---

### Phase 4B: Palace/Room CRUD (Day 5–8)

#### Step 4.B.1 — Create Palace detail page

📁 **File:** `apps/web/src/app/(dashboard)/palace/[palaceId]/page.tsx`

#### Step 4.B.2 — Create Room page with canvas entry point

📁 **File:** `apps/web/src/app/(dashboard)/palace/[palaceId]/room/[roomId]/page.tsx`

#### Step 4.B.3 — Implement soft-delete for Palaces

Soft-delete sets `deleted_at` timestamp instead of removing rows. A scheduled cleanup permanently deletes after 30 days.

📖 **Docs ref:** [ARCHITECTURE.md §6 — Soft Deletes Strategy](./ARCHITECTURE.md#6-additional-architecture-decisions)

#### Step 4.B.4 — Implement cursor-based pagination

All list endpoints use cursor-based pagination with `created_at` + `id` composite cursor.

📖 **Docs ref:** [ARCHITECTURE.md §6 — Pagination Strategy](./ARCHITECTURE.md#6-additional-architecture-decisions)

---

### Phase 4C: Settings & Profile (Day 9–10)

#### Step 4.C.1 — Create Settings page at `/settings`

- Theme preference toggle, notification preferences, export/import data, account management

#### Step 4.C.2 — Create Profile page at `/profile`

- Display name, avatar, email, edit profile form

#### Step 4.C.3 — Implement data export/import

Server Action to export all palace data as JSON, and import with Zod validation + transaction.

📖 **Docs ref:** [ARCHITECTURE.md §6 — Data Export/Import](./ARCHITECTURE.md#6-additional-architecture-decisions)

---

## Phase 5: Spatial Canvas (Weeks 7–9)

**Goal:** Build the interactive React Flow canvas with drag-and-drop, real-time sync, offline support, and mobile optimization.

---

### Phase 5A: React Flow Setup (Day 1–3)

#### Step 5.A.1 — Install React Flow and Zustand

🔧 **Command:**

```bash
pnpm add reactflow zustand --filter web
```

📁 **File:** `apps/web/src/features/spatial-canvas/store/useRoomStore.ts`

```typescript
import { create } from 'zustand';

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface RoomState {
  nodePositions: Map<string, NodePosition>;
  moveNode: (id: string, x: number, y: number) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  nodePositions: new Map(),
  moveNode: (id, x, y) =>
    set((state) => {
      const newPositions = new Map(state.nodePositions);
      newPositions.set(id, { id, x, y });
      return { nodePositions: newPositions };
    }),
}));
```

✅ **Test (Unit):** `useRoomStore.moveNode()` updates position. State transitions are immutable.

🎯 **Outcome:** Zustand store for 60fps drag — coordinates stay in memory during drag, never hitting the server.

📖 **Docs ref:** [ARCHITECTURE.md §2 — System Architecture](./ARCHITECTURE.md#2-system-architecture--data-flow), [ARCHITECTURE.md §7 — "Transient state stays local"](./ARCHITECTURE.md#7-guiding-principles)

---

#### Step 5.A.2 — Create the React Flow canvas component

📁 **File:** `apps/web/src/features/spatial-canvas/components/ReactFlowCanvas.tsx`

```typescript
'use client';
import ReactFlow, { MiniMap, Controls, Background, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';

export function ReactFlowCanvas({ roomId }: { roomId: string }) {
  return (
    <div className="w-full h-full" data-testid="canvas-container">
      <ReactFlow
        panOnDrag={[1, 2]}
        zoomOnPinch={true}
        zoomOnScroll={false}
        preventScrolling={true}
        onlyRenderVisibleElements={true}
        snapToGrid={false}
        snapGrid={[20, 20]}
        nodeExtent={[[-10000, -10000], [10000, 10000]]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <MiniMap className="hidden md:block" />
        <Controls className="md:hidden" showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
```

🎯 **Outcome:** Canvas renders with touch support, pinch zoom, and viewport-only rendering.

📖 **Docs ref:** [UI_STYLE_GUIDE.md §2 — Canvas on Mobile](./UI_STYLE_GUIDE.md#2-canvas-on-mobile-react-flow), [PERFORMANCE.md §2 — Canvas Node Virtualization](./PERFORMANCE.md#2-canvas-node-virtualization)

---

#### Step 5.A.3 — Create `CanvasErrorBoundary`

📁 **File:** `apps/web/src/features/spatial-canvas/components/CanvasErrorBoundary.tsx`

Wraps **only** the canvas. Sidebar and navigation remain alive if canvas crashes. Fallback UI with a "Retry" button.

✅ **Test (E2E):** Force canvas error → error boundary renders → sidebar stays alive → click recover → canvas reloads.

📖 **Docs ref:** [ARCHITECTURE.md §5.B — Canvas Error Boundary](./ARCHITECTURE.md#5-critical-implementation-details)

---

### Phase 5B: Drag & Persistence (Day 4–7)

#### Step 5.B.1 — Install TanStack Query

🔧 **Command:**

```bash
pnpm add @tanstack/react-query --filter web
```

#### Step 5.B.2 — Implement drag-and-drop with optimistic save

React Flow reads from Zustand via selectors (zero re-renders). On drop, `batchUpdateNodes` fires as an optimistic mutation.

✅ **Test (E2E):** Drag node from (100,100) to (300,400) → reload → node persisted at (300,400).

📖 **Docs ref:** [ARCHITECTURE.md §2 — Request Lifecycle](./ARCHITECTURE.md#2-system-architecture--data-flow), [PERFORMANCE.md §3 — Debounced Auto-Save](./PERFORMANCE.md#3-debounced-auto-save-strategy)

#### Step 5.B.3 — Install debounce for text editing

🔧 **Command:**

```bash
pnpm add use-debounce --filter web
```

| Action            | Strategy           | Timing                     |
| ----------------- | ------------------ | -------------------------- |
| Node drag         | Save on drop       | Immediate on `dragend`     |
| Node text editing | Debounced save     | 500ms after last keystroke |
| Multi-node drag   | Batch save on drop | Single transaction         |

📖 **Docs ref:** [PERFORMANCE.md §3 — Debounced Auto-Save Strategy](./PERFORMANCE.md#3-debounced-auto-save-strategy)

---

### Phase 5C: Realtime Sync & Offline (Day 8–12)

#### Step 5.C.1 — Install Yjs for CRDT-based sync

🔧 **Command:**

```bash
pnpm add yjs y-indexeddb y-supabase --filter web
```

- `y-indexeddb` for offline persistence
- `y-supabase` for Supabase Realtime integration
- Yjs `UndoManager` for undo/redo

✅ **Test (E2E):** Drag node → go offline → drag again → go online → both changes persisted.

✅ **Test (E2E):** Open room in Tab A and Tab B → drag node in Tab A → node moves in Tab B.

📖 **Docs ref:** [ARCHITECTURE.md §2 — Offline Resilience](./ARCHITECTURE.md#2-system-architecture--data-flow)

---

### Phase 5D: Advanced Canvas UX (Day 13–17)

#### Step 5.D.1 — Mobile canvas optimizations

| Feature                   | Implementation                             |
| ------------------------- | ------------------------------------------ |
| FAB toolbar               | Collapsible radial menu (`md:hidden`)      |
| Bottom sheet node editor  | shadcn `Sheet` (`side="bottom"`) on `< md` |
| Larger node touch targets | `min-w-[60px] min-h-[60px]` on mobile      |
| Full-screen takeover      | Hide nav during canvas editing             |

📖 **Docs ref:** [UI_STYLE_GUIDE.md §2 — Canvas on Mobile](./UI_STYLE_GUIDE.md#2-canvas-on-mobile-react-flow)

#### Step 5.D.2 — Multi-select, snap-to-grid, context menus, floating toolbar

- Lasso selection: `selectionOnDrag={true}`
- Snap-to-grid toggle: `G` key, 20px grid
- Right-click context menus (long-press on mobile)
- Floating toolbar above selected nodes

📖 **Docs ref:** [UI_STYLE_GUIDE.md §13 — Canvas-Specific UX Patterns](./UI_STYLE_GUIDE.md#13-canvas-specific-ux-patterns)

---

### Phase 5 — Release Tag: `v0.3.0`

```bash
git tag -a v0.3.0 -m "Phase 5: Spatial Canvas & State Engine"
git push origin v0.3.0
```

> **Deliverable:** Users can drag nodes. Saves are instant (optimistic). Realtime sync across tabs. Offline edits auto-merge. Canvas crashes contained. Fully touch-optimized on mobile.

---

## Phase 6: Command Palette & Shortcuts (Week 10)

**Goal:** Add the universal command palette and 20+ keyboard shortcuts.

---

#### Step 6.1 — Install kbar and create command palette

🔧 **Command:**

```bash
pnpm add kbar --filter web
```

📁 **File:** `apps/web/src/shared/components/CommandPalette.tsx`

- `Cmd/Ctrl+K` to open
- Fuzzy search matching
- 10+ actions: navigate, create, toggle dark mode, search
- Mobile: search icon in top bar opens as full-screen bottom sheet

📖 **Docs ref:** [UI_STYLE_GUIDE.md §8 — Command Palette](./UI_STYLE_GUIDE.md#8-command-palette-cmdk)

---

#### Step 6.2 — Register 20+ keyboard shortcuts

🔧 **Command:**

```bash
pnpm add react-hotkeys-hook --filter web
```

| Category       | Shortcut       | Action              |
| -------------- | -------------- | ------------------- |
| **Navigation** | `g` then `h`   | Go Home             |
|                | `g` then `d`   | Go to Daily Review  |
|                | `g` then `p`   | Go to Palaces       |
|                | `g` then `s`   | Go to Settings      |
| **Creation**   | `c` then `p`   | Create new palace   |
|                | `c` then `n`   | Create new node     |
| **Canvas**     | `Space` (hold) | Pan tool            |
|                | `Delete`       | Delete selected     |
|                | `Cmd+Z`        | Undo                |
|                | `Cmd+Shift+Z`  | Redo                |
|                | `Cmd+A`        | Select all          |
|                | `Cmd+D`        | Duplicate selected  |
|                | `F`            | Fit all nodes       |
|                | `G`            | Toggle snap-to-grid |
| **Global**     | `Cmd+K`        | Command palette     |
|                | `?`            | Shortcuts overlay   |
|                | `t` then `d`   | Toggle dark mode    |
|                | `Esc`          | Close panel/modal   |

📖 **Docs ref:** [UI_STYLE_GUIDE.md §9 — Keyboard Shortcuts System](./UI_STYLE_GUIDE.md#9-keyboard-shortcuts-system)

---

#### Step 6.3 — Create `?` shortcuts overlay (desktop only)

#### Step 6.4 — Mobile command palette trigger via search icon

### Phase 6 — Release Tag: `v0.4.0`

```bash
git tag -a v0.4.0 -m "Phase 6: Command Palette & Shortcuts"
git push origin v0.4.0
```

---

## Phase 7: Animations & Polish (Week 11)

**Goal:** Add micro-interactions, page transitions, celebration animations, and reduced-motion support.

---

#### Step 7.1 — Install framer-motion and canvas-confetti

🔧 **Command:**

```bash
pnpm add framer-motion canvas-confetti --filter web
pnpm add -D @types/canvas-confetti --filter web
```

#### Step 7.2 — Page transitions (200ms fade + slide)

#### Step 7.3 — Node enter/exit animations (300ms scale)

#### Step 7.4 — Celebration confetti for achievements and streaks

#### Step 7.5 — `prefers-reduced-motion` support

All `motion.div` elements use `className="motion-reduce:transition-none"`.

### Animation Reference

| Trigger         | Duration | Implementation                                          |
| --------------- | -------- | ------------------------------------------------------- |
| Page transition | 200ms    | `framer-motion` `AnimatePresence`                       |
| Card hover      | 150ms    | `hover:shadow-lg hover:-translate-y-0.5 transition-all` |
| Node creation   | 300ms    | `framer-motion` `scale: 0 → 1`                          |
| Node deletion   | 200ms    | `framer-motion` `scale: 1 → 0.8`                        |
| Badge unlock    | 1500ms   | `canvas-confetti`                                       |
| Button press    | 100ms    | `active:scale-95 transition-transform`                  |
| Flashcard flip  | 400ms    | `framer-motion` `rotateY`                               |

📖 **Docs ref:** [UI_STYLE_GUIDE.md §11 — Micro-Interactions & Animation System](./UI_STYLE_GUIDE.md#11-micro-interactions--animation-system)

### Phase 7 — Release Tag: `v0.5.0`

```bash
git tag -a v0.5.0 -m "Phase 7: Animations & Polish"
git push origin v0.5.0
```

---

## Phase 8: Production Readiness (Week 12)

**Goal:** Make the app production-ready — monitored, accessible, SEO-optimized, security-hardened, and launched.

---

### Phase 8A: Observability (Day 1–2)

#### Step 8.A.1 — Install and configure Sentry

🔧 **Command:**

```bash
pnpm add @sentry/nextjs --filter web
npx @sentry/wizard@latest -i nextjs
```

Client + server error reporting. Canvas memory leak and Long Task tracking.

📖 **Docs ref:** [DEVELOPMENT.md §12 — Monitoring & Alerting Rules](./DEVELOPMENT.md#12-monitoring--alerting-rules)

#### Step 8.A.2 — Configure alert rules (Sentry, Vercel, Supabase, Upstash)

#### Step 8.A.3 — Add Lighthouse CI to pipeline

📁 **File:** `lighthouse-budget.json`

```json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "interactive", "budget": 3500 },
      { "metric": "first-contentful-paint", "budget": 2000 },
      { "metric": "largest-contentful-paint", "budget": 2500 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "total", "budget": 500 }
    ]
  }
]
```

📖 **Docs ref:** [PERFORMANCE.md §1 — Performance Budget](./PERFORMANCE.md#1-performance-budget), [PERFORMANCE.md §6 — Lighthouse CI](./PERFORMANCE.md#6-lighthouse-ci-github-action)

---

### Phase 8B: Accessibility & SEO (Day 3–4)

- Install `eslint-plugin-jsx-a11y`
- WCAG 2.1 AA color contrast audit
- `aria-live` for drag operations
- Keyboard navigation for canvas nodes
- Skip navigation links

📖 **Docs ref:** [PERFORMANCE.md §1 — Lighthouse: Accessibility ≥ 90](./PERFORMANCE.md#1-performance-budget)

---

### Phase 8C: Public Pages (Day 5–7)

#### Step 8.C.1 — Landing page (`/`)

Hero, stats bar, feature cards, how it works, CTA.

📖 **Docs ref:** [FEATURES.md §7.1 — Landing Page](./FEATURES.md#7-public-pages)

#### Step 8.C.2 — About page (`/about`)

Method of Loci explainer, team, GitHub link.

📖 **Docs ref:** [FEATURES.md §7.2 — About Page](./FEATURES.md#7-public-pages)

#### Step 8.C.3 — Onboarding Wizard (`/join`)

5-step wizard: create account → name palace → choose theme → add first node → complete with confetti.

📖 **Docs ref:** [FEATURES.md §7.3 — Join / Onboarding Wizard](./FEATURES.md#7-public-pages)

---

### Phase 8D: Security Hardening (Day 8–9)

#### Step 8.D.1 — Content Security Policy + security headers

📁 **File:** `apps/web/next.config.mjs`

CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

📖 **Docs ref:** [SECURITY.md §1 — Content Security Policy](./SECURITY.md#1-content-security-policy-csp)

#### Step 8.D.2 — CORS configuration for Supabase

📖 **Docs ref:** [SECURITY.md §2 — CORS Policy](./SECURITY.md#2-cors-policy)

#### Step 8.D.3 — File upload validation (server-side MIME detection)

📖 **Docs ref:** [SECURITY.md §4 — File Upload Validation](./SECURITY.md#4-file-upload-validation)

---

### Phase 8E: Launch Checklist (Day 10)

- [ ] All CI checks pass on `main`
- [ ] Sentry configured and reporting
- [ ] Lighthouse scores: Performance ≥ 85, A11y ≥ 90, Best Practices ≥ 90, SEO ≥ 80
- [ ] Security headers verified via [securityheaders.com](https://securityheaders.com)
- [ ] RLS verified (cross-user data isolation)
- [ ] Rate limiting verified (429 on abuse)
- [ ] CORS configured (no wildcards in production)
- [ ] `.env.example` up to date
- [ ] Public pages live (landing, about, join)
- [ ] E2E tests green: auth, CRUD, canvas, offline, search
- [ ] Data backup strategy active
- [ ] Monitoring alerts configured

### Phase 8 — Release Tag: `v1.0.0` 🚀

```bash
git tag -a v1.0.0 -m "v1.0.0: Production-ready Memory Palace App"
git push origin v1.0.0
```

> **Deliverable:** Production-ready. Fully monitored. E2E tested. Accessible. Secure. Public pages live.

---

## Phase 9: Gamification & Engagement (Weeks 13–16)

**Goal:** Drive daily retention with TalantulApp-inspired engagement mechanics.

---

### Phase 9A: Daily Memory Review (Day 1–4)

- Full-screen review session: 10 random nodes, timed (5 minutes)
- Streak tracking (consecutive daily completions)
- Streak freeze items (1 per 7 days)
- Results screen: score, time, accuracy, personal best comparison
- Completion animation (confetti)

📖 **Docs ref:** [FEATURES.md §2 — Daily Memory Review](./FEATURES.md#2-daily-memory-review)

### Phase 9B: Spaced Repetition Engine (Day 5–8)

- SM-2 algorithm: Again / Hard / Good / Easy ratings
- Node maturity badges: 🔴 New → 🟡 Learning → 🟢 Known → 💎 Mastered
- Review queue dashboard widget: "X nodes due today"
- Leech detection: flag nodes failed >5 times

📖 **Docs ref:** [FEATURES.md §9 — Spaced Repetition Engine](./FEATURES.md#9-spaced-repetition-engine)

### Phase 9C: Memory Games (Day 9–14)

5 game modes, all in full-screen takeover:

| Game                  | Description                         |
| --------------------- | ----------------------------------- |
| Matching Game         | Flip cards to match title ↔ content |
| Fill in the Blank     | Recall blanked key terms            |
| Flashcard Stack       | Swipeable flashcards (Space/→/←)    |
| Association Challenge | Recall nodes from edge labels       |
| Typing Practice       | Type content from memory with diff  |

📖 **Docs ref:** [FEATURES.md §3 — Memory Games](./FEATURES.md#3-memory-games)

### Phase 9D: Points & Badges (Day 15–18)

**Points:**
| Action | Points |
|--------|--------|
| Create node | +5 |
| Daily review | +20 |
| Perfect review | +50 bonus |
| Complete game | +10 |
| 7-day streak | +100 bonus |
| Create palace | +10 |

**Badges:** First Palace, Connected, Century, Week Warrior, Perfect, Memory Master, Explorer, Scholar

**Progress page:** Activity charts (`recharts`), retention heatmap, palace mastery donuts, achievement grid.

🔧 **Command:**

```bash
pnpm add recharts --filter web
```

📖 **Docs ref:** [FEATURES.md §4 — Progress & Gamification](./FEATURES.md#4-progress--gamification), [FEATURES.md §10 — Retention & Activity Visualization](./FEATURES.md#10-retention--activity-visualization)

### Phase 9E: Review Generator & Study Mode (Day 19–24)

- **Study Mode:** Browse by palace → room → node, filter panel, full-text search, expandable cards
- **Review Generator:** Configure source, type, tags, count, mode → preview → session → results → save config → PDF export
- **Onboarding:** 5-step tutorial, contextual tooltips, progressive feature unlocking, shortcut coaching

📖 **Docs ref:** [FEATURES.md §5 — Study Mode](./FEATURES.md#5-study-mode), [FEATURES.md §6 — Review Generator](./FEATURES.md#6-review-generator), [FEATURES.md §11 — Onboarding](./FEATURES.md#11-onboarding--progressive-disclosure)

### Phase 9 — Release Tag: `v1.5.0`

```bash
git tag -a v1.5.0 -m "v1.5.0: Gamification & Engagement"
git push origin v1.5.0
```

> **Deliverable:** Fully gamified app with daily review, spaced repetition (SM-2), 5 game modes, points/badges, progress visualization, study mode, review generator with PDF export.

---

## Phase 10: Backlinks & Knowledge Graph (Weeks 17–18)

**Goal:** Add knowledge-graph features.

- **Backlinks panel:** "What links here?" — lists incoming edges, bottom sheet on mobile
- **`[[reference]]` syntax:** Autocomplete in node content, auto-creates edges
- **Orphan node detection:** Dashed border on canvas, dashboard widget
- **Connection strength:** Edge thickness scales with co-review frequency

📖 **Docs ref:** [FEATURES.md §12 — Backlinks & Node Connections](./FEATURES.md#12-backlinks--node-connections)

### Phase 10 — Release Tag: `v1.6.0`

```bash
git tag -a v1.6.0 -m "v1.6.0: Backlinks & Knowledge Graph"
git push origin v1.6.0
```

---

## Phase 11: 3D Canvas (Post-v1.5.0)

**Goal:** Upgrade to 3D spatial experience.

🔧 **Command:**

```bash
pnpm add @react-three/fiber @react-three/drei three --filter web
pnpm add -D @types/three --filter web
```

- React Three Fiber integration in `features/3d-room/`
- Nodes as 3D objects in room-scale space
- Camera orbit, pan, zoom controls
- LOD strategies for performance
- Memory budgets, GPU monitoring
- **WebXR stretch goal:** VR/AR via `@react-three/xr`

### Phase 11 — Release Tag: `v2.0.0`

```bash
git tag -a v2.0.0 -m "v2.0.0: 3D Canvas"
git push origin v2.0.0
```

---

## Testing Checkpoints

Every phase must pass its testing gate before release:

| Phase | Unit          | Component          | Integration        | E2E                 | Visual     |
| ----- | ------------- | ------------------ | ------------------ | ------------------- | ---------- |
| 1     | ESLint, TS    | —                  | —                  | Auth flow           | —          |
| 2     | `cn()`        | Shell, BottomNav   | —                  | Layout              | —          |
| 3     | Zod, sanitize | —                  | All Server Actions | Search, rate limit  | —          |
| 4     | —             | Cards, Grid, Empty | CRUD               | Palace CRUD         | —          |
| 5     | Zustand store | —                  | batchUpdate        | Drag, offline, sync | Canvas     |
| 6     | —             | CommandPalette     | —                  | `Cmd+K`             | —          |
| 7     | —             | PageTransition     | —                  | —                   | Animations |
| 8     | —             | —                  | —                  | Full regression     | All pages  |
| 9     | SM-2          | Games              | Review actions     | Daily, games        | —          |
| 10    | —             | Backlinks          | Reference edges    | `[[ref]]`           | —          |

### Coverage Thresholds

| Metric                     | Minimum          | Target       |
| -------------------------- | ---------------- | ------------ |
| Unit test coverage         | 80%              | 90%+         |
| Integration test coverage  | 70%              | 85%+         |
| E2E critical path coverage | 100% happy paths | + edge cases |

📖 **Docs ref:** [TESTING.md §8 — Coverage Thresholds](./TESTING.md#8-coverage-thresholds--testing-rules)

---

## Guiding Principles (Non-Negotiables)

| #   | Principle                         | Rationale                                     |
| --- | --------------------------------- | --------------------------------------------- |
| 1   | **The UI is dumb.**               | Logic lives in hooks, stores, Server Actions. |
| 2   | **Trust no client.**              | Zod → Upstash → Drizzle on every action.      |
| 3   | **Transient state stays local.**  | 60fps drag = zero server round-trips.         |
| 4   | **Indexes from Day 1.**           | Prevents N+1 performance cliffs.              |
| 5   | **Pooled connections only.**      | Supavisor prevents exhaustion.                |
| 6   | **Two-phase migrations.**         | Zero-downtime deploys.                        |
| 7   | **Canvas crashes are contained.** | Error boundaries wrap canvas, not page.       |
| 8   | **Mobile-first layouts.**         | Design smallest screen first.                 |

📖 **Docs ref:** [ARCHITECTURE.md §7 — Guiding Principles](./ARCHITECTURE.md#7-guiding-principles)

---

## Cross-Reference Index

| Document                                 | Sections Referenced                                                                                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)     | §1 Tech Stack · §2 Data Flow · §3 Schema · §4 File Structure · §5 Implementation · §6 Decisions · §7 Principles · §8 Layout                                                                                          |
| [UI_STYLE_GUIDE.md](./UI_STYLE_GUIDE.md) | §1 Mobile-First · §2 Canvas Mobile · §3 Colors · §4 Tailwind · §5 Typography · §6 Components · §7 Navigation · §8 Command Palette · §9 Shortcuts · §10 Dark Mode · §11 Animations · §12 Empty States · §13 Canvas UX |
| [FEATURES.md](./FEATURES.md)             | §1 Dashboard · §2 Daily Review · §3 Games · §4 Gamification · §5 Study · §6 Review Generator · §7 Public Pages · §8 Canvas · §9 Spaced Repetition · §10 Visualization · §11 Onboarding · §12 Backlinks               |
| [DEVELOPMENT.md](./DEVELOPMENT.md)       | §1 Branching · §3 Releases · §4 Commits · §5 CI/CD · §6 Branch Protection · §9 Workflow · §10 Secrets · §12 Monitoring · §13 Audit                                                                                   |
| [TESTING.md](./TESTING.md)               | §1 Pyramid · §2 Tools · §3 Unit · §4 Component · §5 Integration · §6 E2E · §7 Visual · §8 Coverage · §9 File Structure                                                                                               |
| [SECURITY.md](./SECURITY.md)             | §1 CSP · §2 CORS · §3 Sanitization · §4 File Upload · §5 Service Role Key · §6 Audit · §7 Rate Limiting                                                                                                              |
| [PERFORMANCE.md](./PERFORMANCE.md)       | §1 Budget · §2 Virtualization · §3 Auto-Save · §4 Images · §5 Bundle · §6 Lighthouse CI                                                                                                                              |

---

_This roadmap was generated by synthesizing all 7 documentation files into a step-by-step implementation guide. Follow it start-to-finish as a complete build guide for the Memory Palace App._
