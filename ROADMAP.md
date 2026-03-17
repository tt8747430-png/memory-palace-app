# Roadmap — Memory Palace App

This document describes the four phases of delivery, from the initial infrastructure skeleton to a production-ready, monitored, and fully tested application.

---

## Overview

| Phase | Title | Timeline | Deliverable |
|---|---|---|---|
| **Phase 1** | Infrastructure Skeleton | Weeks 1–2 | User can sign up, log in, see blank responsive dashboard |
| **Phase 2** | Data Core & Security | Weeks 3–4 | Full CRUD for Palaces/Rooms/Nodes, search works, responsive card grids |
| **Phase 3** | Spatial Canvas & State Engine | Weeks 5–7 | Users can drag nodes, instant saves, offline support, cross-tab sync, mobile canvas UX |
| **Phase 4** | Polish, Assets & Observability | Week 8+ | Production-ready, monitored, tested, accessible, public pages live |
| **Phase 4.5** | Gamification & Engagement | Post-v1.0.0 | Daily review, memory games, points, badges, study mode, review generator |
| **Phase 5** | 3D Canvas | Post-v1.5.0 | React Three Fiber upgrade, WebXR stretch goal |

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
- [ ] **Mobile-first responsive shell** — `DashboardShell`, `BottomNav`, `Sidebar`, `MobileDrawer` components (see [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-responsive-layout-architecture))
- [ ] **`viewport-fit=cover` meta tag** and safe area CSS setup in root `layout.tsx`
- [ ] **Bottom navigation component** with 5 primary tabs (Home, Daily, Games, Progress, Palaces)

### Deliverable

> **User can sign up, log in, and see a blank dashboard.** Infrastructure is fully configured, CI passes on every PR, and the layout is fully responsive with mobile bottom navigation.

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
- [ ] **Palace card grid** with responsive layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- [ ] **Skeleton loading states** for all data-fetching views (palace list, room list, node list)
- [ ] **Touch-friendly card components** — all interactive elements minimum 48px touch targets

### Deliverable

> **Full CRUD for Palaces, Rooms, and Nodes.** Search works. All data is isolated by user via RLS. Rate limiting prevents abuse. Palace cards are responsive and display skeleton states while loading.

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
- [ ] **Canvas mobile optimisations** — `panOnDrag` touch support, `zoomOnPinch={true}`, `zoomOnScroll={false}`
- [ ] **Mini-map hidden on mobile** (`hidden md:block`) with zoom controls shown instead (`md:hidden`)
- [ ] **FAB toolbar on mobile** — collapsible radial menu replacing the desktop toolbar panel
- [ ] **Bottom sheet node editor on mobile** — node editing via shadcn `Sheet` (`side="bottom"`) on `< md` screens
- [ ] **Full-screen takeover mode** for canvas — hide all navigation during canvas editing session
- [ ] **Larger node touch targets** on mobile (`min-w-[60px] min-h-[60px]`)

### Deliverable

> **Users can drag nodes on the canvas. Saves are instant (optimistic). Changes sync across tabs/devices in real time. Offline edits auto-merge on reconnection. Canvas crashes don't take down the app. The canvas is fully touch-optimised on mobile.**

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
- [ ] **Public landing page** (`/`) — hero section, feature cards, stats bar, CTA (see [FEATURES.md §7.1](./FEATURES.md#71-landing-page-))
- [ ] **About page** (`/about`) — Memory Palace technique explainer, team, GitHub link
- [ ] **Onboarding wizard** (`/join`) — step-by-step signup flow with stepper UI (see [FEATURES.md §7.3](./FEATURES.md#73-join--onboarding-wizard-join))

### Deliverable

> **Production-ready application.** Fully monitored with Sentry. E2E test coverage for all critical paths. Accessible. Public landing page and onboarding wizard live. 3D room feature stubbed for the next major milestone.

### Release Tag: `v1.0.0`

---

## Phase 4.5: Gamification & Engagement Features (Post-v1.0.0)

Goal: Drive daily retention with TalantulApp-inspired engagement mechanics adapted for the Memory Palace use case.

> **Reference:** See [FEATURES.md](./FEATURES.md) for full feature specifications.

### Tasks

#### Daily Memory Review
- [ ] Daily review session — 10 random nodes from all user palaces, one attempt per day
- [ ] Timed session with countdown timer and per-node progress indicator
- [ ] Streak tracking — increments on consecutive daily completions, resets on miss
- [ ] Streak freeze item (1 per 7 days) to protect streak on missed days
- [ ] Results screen — score, time taken, accuracy %, personal best comparison
- [ ] Completion animation (confetti / podium) on session finish

#### Memory Games
- [ ] **Matching Game** — flip cards to match node title ↔ content; multiple difficulty grids
- [ ] **Fill in the Blank** — recall blanked-out key terms from node content
- [ ] **Flashcard Stack** — swipeable full-screen flashcards with swipe-right/left scoring
- [ ] **Association Challenge** — given an edge label, recall both connected nodes
- [ ] **Typing Practice** — type node content from memory with real-time diff highlighting
- [ ] Full-screen takeover for all game modes (navigation hidden during gameplay)

#### Points & Achievements
- [ ] Points system: node creation (+5), daily review (+20), perfect review (+50 bonus), games (+10), 7-day streak (+100 bonus), palace creation (+10)
- [ ] Achievement badges: First Palace, Connected, Century (100 nodes), Week Warrior, Perfect, Memory Master, Explorer, Scholar
- [ ] Locked/unlocked badge grid on dashboard and Progress page
- [ ] Bottom sheet with badge description and unlock criteria on tap

#### Progress Tracking
- [ ] Progress rings on palace cards showing retention rate (green ≥80%, amber 50–79%, red <50%)
- [ ] Activity history charts (daily/weekly/monthly) using `recharts` or equivalent
- [ ] Personal best records stored per user (best score, best time, highest streak)
- [ ] Progress page (`/progress`) with all stats, rings, charts, and achievement badges

#### Study Mode
- [ ] Browse nodes by palace → room hierarchy at `/study`
- [ ] Filter panel (node type, tags, difficulty) — bottom sheet on mobile
- [ ] Full-text search integrated into study mode
- [ ] Expandable node cards (shadcn `Accordion`)

#### Review Generator
- [ ] Configuration form: select palaces, rooms, node types, tags, count, review mode
- [ ] Stepper UI for multi-step configuration
- [ ] Preview: show matching node count before starting
- [ ] Save named review configurations per user
- [ ] PDF export of generated review session

### Deliverable

> **Fully gamified Memory Palace app.** Users have compelling daily reasons to return: streak tracking, daily review, multiple game modes, points, badges, and progress visualisation. Review Generator with PDF export. Study Mode for passive browsing.

### Release Tag: `v1.5.0`

---

## Future: Phase 5 — 3D Canvas (Post-v1.5.0)

| Task | Notes |
|---|---|
| React Three Fiber integration | Upgrade `features/3d-room/` stub to full 3D canvas |
| Three.js spatial layout | Nodes as 3D objects in a room-scale space |
| VR/AR support (WebXR) | Long-term stretch goal |
| Performance profiling | Memory budgets for 3D scenes, LOD strategies |
