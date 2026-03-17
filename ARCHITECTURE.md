# Architecture Blueprint — Memory Palace App

This document is the **single source of truth** for all technical decisions in the Memory Palace application. Every technology choice, data model, and implementation pattern is documented here.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [System Architecture & Data Flow](#2-system-architecture--data-flow)
3. [Relational Database Schema](#3-relational-database-schema)
4. [Monorepo File Structure](#4-monorepo-file-structure)
5. [Critical Implementation Details](#5-critical-implementation-details)
6. [Additional Architecture Decisions](#6-additional-architecture-decisions)
7. [Guiding Principles](#7-guiding-principles)
8. [Responsive Layout Architecture](#8-responsive-layout-architecture)

---

## 1. Technology Stack

| Layer                | Tool                                                               | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| **Framework**        | Next.js (App Router)                                               | React foundation, routing, Server Actions, SSR                     |
| **Hosting**          | Vercel (Hobby Tier)                                                | Serverless deployment, global CDN, auto-scaling                    |
| **Database**         | Supabase PostgreSQL (**pooled connection via Supavisor**)          | Relational data, real-time websockets, image storage               |
| **ORM**              | Drizzle ORM                                                        | End-to-end TypeScript-safe database queries                        |
| **Auth & Security**  | Supabase Auth + Row Level Security (RLS)                           | Database-level user isolation                                      |
| **Spatial Canvas**   | React Flow (2D MVP) + future React Three Fiber (3D)                | Interactive node-mapping canvas                                    |
| **Transient State**  | Zustand                                                            | 60fps drag-and-drop without re-renders                             |
| **Server State**     | TanStack Query (React Query)                                       | Caching, optimistic updates, background syncing                    |
| **Multiplayer/Sync** | Yjs (CRDTs) + y-supabase provider                                  | Conflict-free multi-device & multi-user coordinate merging         |
| **Offline Support**  | y-indexeddb                                                        | Local-first persistence, seamless reconnection sync                |
| **Validation**       | Zod                                                                | Server Action input validation                                     |
| **Rate Limiting**    | Upstash Redis (`@upstash/ratelimit`)                               | Abuse prevention at the edge                                       |
| **Monorepo**         | Turborepo (pnpm)                                                   | Physical package boundaries, caching, parallel builds              |
| **Styling**          | Tailwind CSS + shadcn/ui                                           | Accessible, customizable design system                             |
| **Observability**    | Sentry (Client + Server)                                           | Error boundaries, canvas memory leak detection, Long Task tracking |
| **E2E Testing**      | Playwright                                                         | Headless browser drag-and-drop testing                             |
| **Search**           | Supabase PostgreSQL `tsvector` full-text search                    | Finding memories across palaces                                    |
| **Quality**          | TypeScript (Strict), ESLint (`eslint-plugin-boundaries`), Prettier | Automated code quality enforcement                                 |
| **Command Palette**  | kbar                                                               | Universal keyboard-driven command palette (`Cmd+K`)                |
| **Animations**       | Framer Motion                                                      | Page transitions, node animations, flashcard flips                 |
| **Celebrations**     | canvas-confetti                                                    | Achievement unlocks, streak milestones, daily review completion    |
| **Charts**           | Recharts                                                           | Activity history, retention heatmap, review forecast               |
| **Theme**            | next-themes                                                        | Dark/light mode toggle with OS preference detection                |

---

## 2. System Architecture & Data Flow

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────┐    drag @ 60fps    ┌──────────┐                  │
│  │React Flow├───────────────────►│ Zustand   │                  │
│  │ Canvas   │◄───────────────────┤ Store     │                  │
│  └────┬─────┘    read coords     └─────┬────┘                  │
│       │                                │                        │
│       │ on drop                        │ sync via Yjs doc       │
│       ▼                                ▼                        │
│  ┌──────────┐  optimistic save   ┌──────────┐                  │
│  │ TanStack ├───────────────────►│   Yjs    │◄──y-indexeddb──► │
│  │  Query   │                    │  (CRDT)  │   (offline)      │
│  └────┬─────┘                    └─────┬────┘                  │
│       │                                │                        │
└───────┼────────────────────────────────┼────────────────────────┘
        │ Server Action call             │ Supabase Realtime WS
        ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL SERVERLESS EDGE                      │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │  Upstash │──►│   Zod    │──►│ Drizzle  │──►│ Supabase   │  │
│  │  Rate    │   │ Validate │   │   ORM    │   │ PostgreSQL │  │
│  │  Limiter │   │          │   │          │   │ (pooled)   │  │
│  └──────────┘   └──────────┘   └──────────┘   └────────────┘  │
│                                                                 │
│       If rate exceeded → 429 BLOCKED before DB is touched       │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle — Step by Step

1. **Drag** → Zustand updates local coordinates at 60fps. React Flow reads from Zustand via selectors (no global re-renders).
2. **Drop** → TanStack Query fires an optimistic mutation. UI assumes success instantly.
3. **Edge Bouncer** → Upstash checks: "Has this user exceeded 10 saves/5 seconds?" If yes → 429. If no → proceed.
4. **Validation** → Zod verifies the payload shape.
5. **Database** → Drizzle ORM executes the UPDATE via the pooled Supabase connection string.
6. **Realtime Broadcast** → Supabase Realtime pushes the change to all connected sessions → Yjs merges it conflict-free.
7. **Offline Resilience** → If the user was offline, y-indexeddb persisted changes locally. On reconnection, Yjs auto-syncs.

---

## 3. Relational Database Schema

### Tables

#### `users`

| Column         | Type          | Notes                            |
| -------------- | ------------- | -------------------------------- |
| `id`           | `uuid`        | Primary Key (from Supabase Auth) |
| `email`        | `text`        | Unique, not null                 |
| `display_name` | `text`        |                                  |
| `avatar_url`   | `text`        |                                  |
| `created_at`   | `timestamptz` | Default `now()`                  |

#### `palaces`

| Column        | Type          | Notes           |
| ------------- | ------------- | --------------- |
| `id`          | `uuid`        | Primary Key     |
| `user_id`     | `uuid`        | FK → `users.id` |
| `name`        | `text`        | Not null        |
| `description` | `text`        |                 |
| `created_at`  | `timestamptz` | Default `now()` |
| `updated_at`  | `timestamptz` | Auto-updated    |

**Indexes:** `idx_palaces_user_id` on `user_id`

#### `rooms`

| Column         | Type          | Notes                       |
| -------------- | ------------- | --------------------------- |
| `id`           | `uuid`        | Primary Key                 |
| `palace_id`    | `uuid`        | FK → `palaces.id`           |
| `name`         | `text`        | Not null                    |
| `bg_image_url` | `text`        |                             |
| `width`        | `integer`     | Canvas width in pixels      |
| `height`       | `integer`     | Canvas height in pixels     |
| `order`        | `integer`     | Display order within palace |
| `created_at`   | `timestamptz` | Default `now()`             |
| `updated_at`   | `timestamptz` | Auto-updated                |

**Indexes:** `idx_rooms_palace_id` on `palace_id`

#### `nodes`

| Column       | Type          | Notes                           |
| ------------ | ------------- | ------------------------------- |
| `id`         | `uuid`        | Primary Key                     |
| `room_id`    | `uuid`        | FK → `rooms.id`                 |
| `user_id`    | `uuid`        | FK → `users.id`                 |
| `title`      | `text`        | Not null                        |
| `content`    | `text`        | Searchable body                 |
| `position_x` | `float8`      | X coordinate on canvas          |
| `position_y` | `float8`      | Y coordinate on canvas          |
| `position_z` | `float8`      | Z-index / depth (for future 3D) |
| `node_type`  | `text`        | e.g. `image`, `text`, `link`    |
| `created_at` | `timestamptz` | Default `now()`                 |
| `updated_at` | `timestamptz` | Auto-updated                    |

**Indexes:**

- `idx_nodes_room_id` on `room_id`
- `idx_nodes_user_id` on `user_id`
- `idx_nodes_content_fts` — GIN index on `to_tsvector('english', content)`

#### `edges`

| Column           | Type          | Notes           |
| ---------------- | ------------- | --------------- |
| `id`             | `uuid`        | Primary Key     |
| `source_node_id` | `uuid`        | FK → `nodes.id` |
| `target_node_id` | `uuid`        | FK → `nodes.id` |
| `label`          | `text`        |                 |
| `created_at`     | `timestamptz` | Default `now()` |

**Indexes:** Composite `idx_edges_source_target` on `(source_node_id, target_node_id)`

#### `tags`

| Column    | Type   | Notes           |
| --------- | ------ | --------------- |
| `id`      | `uuid` | Primary Key     |
| `name`    | `text` | Not null        |
| `user_id` | `uuid` | FK → `users.id` |

**Indexes:** `idx_tags_user_id` on `user_id`

#### `node_tags`

| Column    | Type   | Notes           |
| --------- | ------ | --------------- |
| `node_id` | `uuid` | FK → `nodes.id` |
| `tag_id`  | `uuid` | FK → `tags.id`  |

**Primary Key:** Composite `(node_id, tag_id)`

### Row Level Security (RLS)

RLS is enabled on all tables. Example policy:

```sql
-- Users can only access their own palaces
CREATE POLICY "Users can only access their own data"
ON palaces FOR ALL
USING (auth.uid() = user_id);

-- Nodes inherit access through room → palace → user ownership
CREATE POLICY "Users can only access nodes in their rooms"
ON nodes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM rooms r
    JOIN palaces p ON r.palace_id = p.id
    WHERE r.id = nodes.room_id
    AND p.user_id = auth.uid()
  )
);
```

### Full-Text Search Index

```sql
CREATE INDEX idx_nodes_content_fts
ON nodes
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
```

---

## 4. Monorepo File Structure

Full Turborepo + Feature-Sliced Design directory tree:

```
memory-palace-app/
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       ├── migrate.yml
│       └── release.yml
│
├── apps/
│   └── web/                            # Next.js Application
│       ├── src/
│       │   ├── app/                    # App Router routes
│       │   │   ├── (auth)/login/page.tsx
│       │   │   ├── (auth)/signup/page.tsx
│       │   │   ├── (dashboard)/page.tsx
│       │   │   ├── palace/[palaceId]/room/[roomId]/page.tsx
│       │   │   ├── layout.tsx
│       │   │   └── error.tsx
│       │   ├── features/
│       │   │   ├── spatial-canvas/     # React Flow, Zustand store, canvas actions
│       │   │   ├── memory-nodes/       # Node CRUD, Zod schemas
│       │   │   ├── search/             # Full-text search
│       │   │   ├── auth/               # Login/signup components
│       │   │   └── 3d-room/            # FUTURE: React Three Fiber
│       │   ├── shared/
│       │   │   ├── components/         # ErrorBoundary, LoadingSpinner
│       │   │   ├── lib/                # Supabase clients, rate-limit, yjs-provider
│       │   │   └── utils/
│       │   └── middleware.ts
│       ├── next.config.mjs
│       └── package.json
│
├── packages/
│   ├── db/                             # Drizzle schema, migrations, client
│   ├── ui/                             # shadcn/ui components
│   ├── eslint-config/
│   └── typescript-config/
│
└── playwright/                         # E2E tests
```

---

## 5. Critical Implementation Details

### A. Database Connection Pooling

**MUST** use the Supavisor pooler URL — never the direct connection string in serverless functions.

```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// ✅ CORRECT: pooled connection via Supavisor (port 6543)
const sql = postgres(process.env.DATABASE_URL!); // db.pooler.supabase.com:6543

export const db = drizzle(sql);
```

```
# .env.local
# ✅ Pooled (Supavisor) — use this everywhere in serverless
DATABASE_URL=postgresql://postgres.<ref>:<password>@db.pooler.supabase.com:6543/postgres

# ❌ Direct — only for migrations from a long-lived process
# DIRECT_DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.com:5432/postgres
```

### B. Canvas Error Boundary

Wraps **only** the canvas element. The sidebar and navigation remain alive if the canvas crashes.

```typescript
// src/features/spatial-canvas/components/CanvasErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Report to Sentry — canvas memory leak, Long Task, etc.
    console.error('[Canvas Error]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <p>Canvas crashed. <button onClick={() => this.setState({ hasError: false })}>Retry</button></p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

```typescript
// Usage in the room page
<CanvasErrorBoundary>
  <ReactFlowCanvas roomId={roomId} />
</CanvasErrorBoundary>
```

### C. Batch Saving

All multi-node position updates are sent in a **single Server Action** using a SQL transaction — not one call per node.

```typescript
// src/features/spatial-canvas/actions/batchUpdateNodes.ts
'use server';

import { db } from '@memory-palace/db';
import { nodes } from '@memory-palace/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkRateLimit } from '@/shared/lib/rate-limit';

const NodePositionSchema = z.object({
  id: z.string().uuid(),
  position_x: z.number(),
  position_y: z.number(),
});

const BatchUpdateSchema = z.object({
  roomId: z.string().uuid(),
  updates: z.array(NodePositionSchema).min(1).max(100),
});

export async function batchUpdateNodes(input: unknown) {
  const { roomId, updates } = BatchUpdateSchema.parse(input);

  await checkRateLimit(); // throws 429 if exceeded

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

### D. Full-Text Search

PostgreSQL `tsvector` GIN index enables sub-millisecond search across all node content.

```typescript
// src/features/search/actions/searchNodes.ts
'use server';

import { db } from '@memory-palace/db';
import { sql } from 'drizzle-orm';

export async function searchNodes(query: string, userId: string) {
  return db.execute(sql`
    SELECT id, title, content, room_id,
           ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')),
                   plainto_tsquery('english', ${query})) AS rank
    FROM nodes
    WHERE user_id = ${userId}
      AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
          @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20
  `);
}
```

### E. Migration Rollback Strategy

**Two-phase approach** — never drop a column in a single deploy.

```
Phase 1 (current release): Add new column, backfill data, update code to write to both old + new columns.
Phase 2 (next release):    Remove the old column after confirming Phase 1 is stable.
```

```typescript
// ✅ Phase 1 migration — add new column safely
export async function up(db: NodePgDatabase) {
  await db.execute(sql`ALTER TABLE nodes ADD COLUMN content_v2 text`);
  await db.execute(sql`UPDATE nodes SET content_v2 = content`);
  // Application code now writes to BOTH content and content_v2
}

// ✅ Phase 2 migration (next release) — remove old column
export async function up(db: NodePgDatabase) {
  await db.execute(sql`ALTER TABLE nodes DROP COLUMN content`);
  await db.execute(sql`ALTER TABLE nodes RENAME COLUMN content_v2 TO content`);
}
```

### F. Rate Limiting

Upstash sliding window — 10 requests per 5 seconds — checked **before** any database operation.

```typescript
// src/shared/lib/rate-limit.ts
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

---

## 6. Additional Architecture Decisions

### Soft Deletes Strategy

Palaces, rooms, and nodes are **never hard-deleted**. This protects users from accidental data loss and enables a Trash/restore workflow.

**Implementation:**

- Add a `deleted_at` column (nullable `timestamptz`) to the `palaces`, `rooms`, and `nodes` tables
- All list queries filter `WHERE deleted_at IS NULL` by default
- A scheduled cleanup job permanently deletes rows where `deleted_at` is older than 30 days
- Users can restore deleted items from a "Trash" view (filtered by `deleted_at IS NOT NULL`)

```sql
ALTER TABLE palaces ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE rooms   ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE nodes   ADD COLUMN deleted_at timestamptz DEFAULT NULL;
```

### Pagination Strategy

All list endpoints use **cursor-based pagination** — not offset pagination. Cursor pagination is stable (no skipped or duplicated rows when new items are inserted) and performs well at scale.

- **Cursor:** Composite of `created_at` timestamp + `id` for deterministic ordering
- **Default page size:** 20 items
- **Direction:** Descending by `created_at` (newest first)

```typescript
async function listPalaces(userId: string, cursor?: { createdAt: Date; id: string }) {
  return db
    .select()
    .from(palaces)
    .where(
      and(
        eq(palaces.userId, userId),
        isNull(palaces.deletedAt),
        cursor
          ? or(
              lt(palaces.createdAt, cursor.createdAt),
              and(eq(palaces.createdAt, cursor.createdAt), lt(palaces.id, cursor.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(palaces.createdAt), desc(palaces.id))
    .limit(20);
}
```

### Data Export/Import

Users can export their entire palace data as a single JSON file. This serves as both a user-facing feature and a personal disaster recovery mechanism.

**Export includes:**

- Palace metadata (name, description, timestamps)
- All rooms with dimensions and background image references
- All nodes with coordinates, content, and type
- All edges (connections between nodes)
- All tags and node-tag associations

**Import flow:**

1. User selects a previously exported JSON file
2. A Server Action validates the entire JSON structure with Zod before any insert
3. All records are inserted in a single database transaction
4. Conflicts (duplicate IDs) are handled via `ON CONFLICT DO NOTHING`

### Server Action Response Standard

All Server Actions return a discriminated union type to allow type-safe error handling on the client:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } };

type ErrorCode =
  | 'RATE_LIMITED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';
```

TanStack Query's `onError` handler receives the typed `error` object. The UI can render specific messages based on `error.code` (e.g., show a toast with a retry button on `RATE_LIMITED`).

### Server Action Naming Convention

- **Pattern:** `[verb][Entity]` in camelCase
- **Examples:** `createPalace`, `updateNode`, `batchUpdateNodes`, `searchNodes`, `deletePalace`
- All actions live in their feature's `actions/` directory (e.g., `src/features/memory-nodes/actions/`)
- All actions are `async` functions that return `ActionResponse<T>`

---

## 7. Guiding Principles

These are **non-negotiables** that must be respected in every PR.

| #   | Principle                                                                                                                                      | Rationale                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | **The UI is dumb.** Components display data and fire events. Logic lives in hooks, stores, and Server Actions.                                 | Prevents business logic sprawl; simplifies testing.                       |
| 2   | **Trust no client.** Every Server Action validates with Zod, then checks Upstash rate limit, then touches Drizzle.                             | Defense-in-depth against malformed/malicious payloads.                    |
| 3   | **Transient state stays local.** X/Y coordinates live in Zustand only. They hit the database only on drop via batch save.                      | 60fps drag requires zero server round-trips during motion.                |
| 4   | **Indexes from Day 1.** Every foreign key gets an index. Search gets a GIN index. No exceptions.                                               | Prevents N+1 query performance cliffs at scale.                           |
| 5   | **Pooled connections only.** Never use Supabase's direct connection string in serverless functions.                                            | Supavisor prevents connection exhaustion under load.                      |
| 6   | **Two-phase migrations.** Never drop a column in a single deploy.                                                                              | Guarantees zero-downtime deployments and instant rollback.                |
| 7   | **Canvas crashes are contained.** Error Boundaries wrap the canvas, not the page.                                                              | Users never lose access to navigation or sidebar on canvas failure.       |
| 8   | **Mobile-first layouts.** All dashboard components are designed for the smallest screen first. Desktop enhancements are progressive overrides. | Ensures a quality experience for the majority of users on mobile devices. |

---

## 8. Responsive Layout Architecture

> **Cross-reference:** See [UI_STYLE_GUIDE.md](./UI_STYLE_GUIDE.md) for the full design system, color palette, breakpoint strategy, and component patterns.

The dashboard uses a **shell-based responsive layout** that composes four components — `DashboardShell`, `Sidebar`, `BottomNav`, and `MobileDrawer` — to provide the correct navigation experience at every screen size.

### Component Roles

| Component        | Rendered On     | Description                                                            |
| ---------------- | --------------- | ---------------------------------------------------------------------- |
| `DashboardShell` | All screens     | Root wrapper. Composes all layout pieces. Sets `h-[100dvh]`.           |
| `Sidebar`        | `md`+ (desktop) | Fixed left sidebar, 256px wide, icon + label navigation                |
| `BottomNav`      | `< md` (mobile) | Fixed bottom tab bar with 5 primary tabs                               |
| `MobileDrawer`   | `< md` (mobile) | Top bar hamburger → shadcn `Sheet` sliding from the left with full nav |

### File Structure

```
apps/web/src/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx          # Wraps all dashboard pages in DashboardShell
│       └── page.tsx            # Dashboard home page
│
└── features/
    └── dashboard/
        ├── components/
        │   ├── DashboardShell.tsx
        │   ├── Sidebar.tsx
        │   ├── BottomNav.tsx
        │   └── MobileDrawer.tsx
        └── index.ts            # Barrel export
```

### `(dashboard)/layout.tsx`

```tsx
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

### `DashboardShell.tsx`

```tsx
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
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r">
        <Sidebar />
      </aside>
      <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        <MobileDrawer />
        <h1 className="text-lg font-semibold">Memory Palace</h1>
        <button className="rounded-full p-2">🔔</button>
      </header>
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        <BottomNav />
      </nav>
    </div>
  );
}
```

**Key decisions:**

- `h-[100dvh]` — dynamic viewport height handles mobile browser chrome correctly (see [UI_STYLE_GUIDE.md §1](./UI_STYLE_GUIDE.md#1-mobile-first-design-strategy))
- `pb-[calc(4rem+env(safe-area-inset-bottom))]` — main content scrolls above the bottom nav + iOS home indicator
- `pb-[env(safe-area-inset-bottom)]` — bottom nav itself pads for the iOS home indicator

### `BottomNav.tsx`

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Gamepad2, Trophy, Map } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/daily', icon: Calendar, label: 'Daily' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/progress', icon: Trophy, label: 'Progress' },
  { href: '/palace', icon: Map, label: 'Palaces' },
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
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
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

**Key decisions:**

- `min-w-[48px] min-h-[48px]` — meets Apple HIG and Material Design 48px minimum touch target requirement
- Active state uses `strokeWidth={2.5}` for a bold filled feel without needing separate icon variants
- `text-[0.625rem]` (10px) labels — small enough to not compete with icons on narrow screens
