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

---

## Post-v1 backlog — Figma 2026 Polish

Source: 15 Figma reference folders; full plan in [`docs/plans/IMPLEMENTATION_APP_PLAN_FIGMA.md`](../plans/IMPLEMENTATION_APP_PLAN_FIGMA.md). One PR per slice:

- **Slice A — Dashboard polish.** Pill nav + KPI tile system + area chart with hover tooltip + mobile bottom-nav circular indicator + dashed empty states.
- **Slice B — Sidebar lift.** Workspace switcher + persistent `Quick actions ⌘K` row.
- **Slice C — Practice / stats.** Concentric mastery rings + partial-arc donut; `getPracticeStats` gains an additive `mastery` field.
- **Slice D — Journey.** Horizontal stepper (`md:` and up); vertical stack stays on mobile.
- **Slice E — Marketing rhythm.** Soft-card section + `explore the interface »` cue.
- **Slice F — Slide-to-confirm.** Destructive confirms + flashcards Easy gesture (framer-motion only, no new dependency).
- **Slice G — Neutral ramp audit.** Compare against `SoftwareColors/Theming Light/Dark Mode`; tweak 1–2 stops only if contrast drift is measurable.

ADR `docs/adr/15-figma-2026-polish.md` to be written at Phase-2 kickoff.
