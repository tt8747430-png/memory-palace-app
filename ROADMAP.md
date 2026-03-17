# Roadmap — Memory Palace App

This document describes the four phases of delivery, from the initial infrastructure skeleton to a production-ready, monitored, and fully tested application.

---

## Overview

| Phase | Title | Timeline | Deliverable |
|---|---|---|---|
| **Phase 1** | Infrastructure Skeleton | Weeks 1–2 | User can sign up, log in, see blank dashboard |
| **Phase 2** | Data Core & Security | Weeks 3–4 | Full CRUD for Palaces/Rooms/Nodes, search works |
| **Phase 3** | Spatial Canvas & State Engine | Weeks 5–7 | Users can drag nodes, instant saves, offline support, cross-tab sync |
| **Phase 4** | Polish, Assets & Observability | Week 8+ | Production-ready, monitored, tested, accessible |

---

## Phase 1: Infrastructure Skeleton (Weeks 1–2)

Goal: Stand up the full monorepo structure and prove that a user can authenticate.

### Tasks

- [ ] Turborepo init with pnpm workspaces
- [ ] Next.js App Router in `apps/web`
- [ ] Create `packages/db` (Drizzle, migrations, client)
- [ ] Create `packages/ui` (shadcn/ui base components)
- [ ] Create `packages/eslint-config`
- [ ] Create `packages/typescript-config`
- [ ] Configure ESLint boundary rules (`eslint-plugin-boundaries`)
- [ ] Supabase project creation (free tier)
- [ ] Supabase Auth with `@supabase/ssr` (cookie-based, server-side)
- [ ] Login page at `(auth)/login/page.tsx`
- [ ] Signup page at `(auth)/signup/page.tsx`
- [ ] Auth middleware at `middleware.ts`
- [ ] GitHub Actions CI pipeline (`ci.yml`)
- [ ] Vercel project setup and `deploy.yml`
- [ ] i18n readiness: install `next-intl`, create `/messages/en.json`, wrap app in i18n provider
- [ ] Create `.env.example` file with all required variables documented
- [ ] Set up local Supabase via Docker for development

### Deliverable

> **User can sign up, log in, and see a blank dashboard.** Infrastructure is fully configured and CI passes on every PR.

### Release Tag: `v0.1.0`

---

## Phase 2: Data Core & Security (Weeks 3–4)

Goal: Build the complete data layer with security guarantees.

### Tasks

- [ ] Drizzle ORM schema with all tables: `users`, `palaces`, `rooms`, `nodes`, `edges`, `tags`, `node_tags`
- [ ] All foreign key indexes from Day 1 (see `ARCHITECTURE.md` §3)
- [ ] GIN index on `nodes.content` for full-text search
- [ ] Row Level Security (RLS) policies on all tables
- [ ] First Drizzle migration + `migrate.yml` workflow
- [ ] Server Actions with Zod validation for Palace, Room, and Node CRUD
- [ ] Upstash rate limiting middleware (10 requests / 5 seconds)
- [ ] Batch update endpoint for multi-node position saves
- [ ] Full-text search via `tsvector` — `searchNodes` Server Action
- [ ] Search UI in the dashboard

### Deliverable

> **Full CRUD for Palaces, Rooms, and Nodes.** Search works. All data is isolated by user via RLS. Rate limiting prevents abuse.

### Release Tag: `v0.2.0`

---

## Phase 3: Spatial Canvas & State Engine (Weeks 5–7)

Goal: Build the interactive canvas with real-time sync and offline support.

### Tasks

- [ ] React Flow canvas integration in `features/spatial-canvas/`
- [ ] Zustand store for room state (`useRoomStore`) — coordinates never leave the store during drag
- [ ] React Flow reads from Zustand via selectors (zero global re-renders at 60fps)
- [ ] TanStack Query optimistic mutations for node saves
- [ ] Batch save on drop event (single Server Action call per drop)
- [ ] Yjs CRDT document for real-time coordinate merging
- [ ] `y-supabase` provider for Supabase Realtime integration
- [ ] `y-indexeddb` for offline-first persistence
- [ ] Canvas Error Boundary wrapping only the React Flow canvas
- [ ] Drag-and-drop tested with Playwright
- [ ] Keyboard navigation for all canvas nodes
- [ ] `aria-live` announcements for drag operations
- [ ] `prefers-reduced-motion` support for canvas animations
- [ ] WCAG 2.1 AA color contrast compliance audit and fixes
- [ ] Install `eslint-plugin-jsx-a11y` and enforce in ESLint config

### Deliverable

> **Users can drag nodes on the canvas. Saves are instant (optimistic). Changes sync across tabs/devices in real time. Offline edits auto-merge on reconnection. Canvas crashes don't take down the app.**

### Release Tag: `v0.3.0`

---

## Phase 4: Polish, Assets & Observability (Week 8+)

Goal: Make the app production-ready — monitored, tested, accessible, and ready for public users.

### Tasks

- [ ] Asset pipeline: Supabase Storage for room background images
- [ ] Next.js image optimization for uploaded assets
- [ ] Sentry client integration (Error Boundary reporting, Long Task detection)
- [ ] Sentry server integration (Server Action error tracking)
- [ ] Canvas memory leak detection via Sentry performance monitoring
- [ ] Playwright E2E test suite: drag-and-drop, offline sync, auth flows
- [ ] Accessibility (a11y) audit and fixes for canvas nodes
- [ ] Keyboard navigation support for canvas
- [ ] `src/features/3d-room/` stub scaffolded for future React Three Fiber
- [ ] `release.yml` workflow with `git-cliff` changelog generation
- [ ] Performance budget: Lighthouse CI score targets
- [ ] Data backup strategy: weekly `pg_dump` via scheduled GitHub Action (or Supabase Pro auto-backups)
- [ ] Soft delete implementation with 30-day retention
- [ ] Data export/import feature (JSON format)
- [ ] Monitoring & alerting setup (Sentry alerts, Vercel alerts, Upstash monitoring)
- [ ] Lighthouse CI integration for performance regression detection

### Deliverable

> **Production-ready application.** Fully monitored with Sentry. E2E test coverage for all critical paths. Accessible. 3D room feature stubbed for the next major milestone.

### Release Tag: `v1.0.0`

---

## Future: Phase 5 — 3D Canvas (Post-v1.0.0)

| Task | Notes |
|---|---|
| React Three Fiber integration | Upgrade `features/3d-room/` stub to full 3D canvas |
| Three.js spatial layout | Nodes as 3D objects in a room-scale space |
| VR/AR support (WebXR) | Long-term stretch goal |
| Performance profiling | Memory budgets for 3D scenes, LOD strategies |
