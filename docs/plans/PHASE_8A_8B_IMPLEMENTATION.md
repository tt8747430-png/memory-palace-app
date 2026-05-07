# Phase 8A & 8B Implementation Plan

**Status:** AWAITING APPROVAL — no application code written yet.
**Date drafted:** 2026-05-07
**Based on:** `docs/archive/ROADMAP-aspirational.md` §8A–8B, `.project_memory.md`, current codebase audit.

---

## 1. Baseline audit

| Area                        | Current state                                                                                    | Gap                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Sentry                      | Not installed                                                                                    | Full integration needed                                                         |
| Lighthouse CI               | Not in CI pipeline                                                                               | New workflow + budget file needed                                               |
| `eslint-plugin-jsx-a11y`    | `eslint-config-next/core-web-vitals` includes a subset of rules; standalone plugin not installed | Stricter rule coverage needed                                                   |
| Color contrast (light mode) | `--muted-foreground: hsl(240 4% 46%)` on white = ~4.24:1 (FAILS WCAG AA 4.5:1)                   | Darken to ~4.5:1+                                                               |
| Color contrast (dark mode)  | `--muted-foreground: hsl(240 5% 65%)` on `hsl(240 10% 4%)` = passes                              | None                                                                            |
| `aria-live` for drag        | Not present                                                                                      | New `CanvasDragAnnouncer` component                                             |
| Canvas keyboard navigation  | React Flow provides Tab/arrow built-in; `CanvasToolbar` has `role="toolbar"`                     | Needs `aria-label` on the canvas region + keyboard shortcut documentation in UI |
| Skip navigation             | Not present                                                                                      | New `SkipToContent` component in root layout                                    |
| Per-page SEO metadata       | Root layout has base `title`/`description`; no OG, no per-page `generateMetadata`                | Add per-page metadata + OG tags                                                 |

---

## 2. Phase 8A — Observability

### 2A.1 — Sentry integration

**Dependencies to add:**

```
@sentry/nextjs  (apps/web only)
```

**New files:**
| File | Purpose |
|---|---|
| `apps/web/sentry.client.config.ts` | Browser SDK init (DSN, session replay, performance) |
| `apps/web/sentry.server.config.ts` | Node.js server SDK init |
| `apps/web/sentry.edge.config.ts` | Edge runtime SDK init |
| `apps/web/src/instrumentation.ts` | Next.js instrumentation hook — registers server SDK via `registerOTelInstrumentation` path |

**Modified files:**
| File | Change |
|---|---|
| `apps/web/next.config.ts` | Wrap export with `withSentryConfig(nextConfig, sentryBuildOptions)` |
| `apps/web/src/shared/lib/env.ts` | Add `SENTRY_DSN` (server-only), `NEXT_PUBLIC_SENTRY_DSN` (public) |
| `apps/web/src/features/spatial-canvas/components/CanvasErrorBoundary.tsx` | Call `Sentry.captureException(error)` in `componentDidCatch` |

**Configuration decisions:**

- `SENTRY_DSN` from `env.ts` — never `process.env.SENTRY_DSN!` inline.
- `tracesSampleRate: 0.2` in production (1.0 in development).
- `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`.
- Canvas Long Task monitoring: `PerformanceObserver` for `longtask` entries, forwarded to Sentry as a breadcrumb in `sentry.client.config.ts`. This runs outside React (raw Web API) to avoid React Compiler interference.
- `withSentryConfig` options: `silent: true` in CI, `hideSourceMaps: true` for production builds.
- **React Compiler note:** Sentry's automatic instrumentation patches `React.createElement`; the React Compiler output uses direct JSX transform — this is compatible. No special opt-out needed.

**Edge cases:**

- Sentry must not throw when `SENTRY_DSN` is absent (local dev without `.env.local`). Wrap `Sentry.init` in a guard: `if (!dsn) return;`.
- `instrumentation.ts` is loaded once per server cold start; it must not call `getDb()` or read cookies.

---

### 2A.2 — Lighthouse CI

**New files:**
| File | Purpose |
|---|---|
| `lighthouse-budget.json` | Performance budgets (from aspirational roadmap) |
| `.github/workflows/lighthouse-ci.yml` | Run Lighthouse CI against the preview deployment on PRs |

**`lighthouse-budget.json` (root of monorepo):**

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

**Lighthouse CI workflow design:**

- Trigger: `pull_request` to `main` (same as existing CI gate).
- Needs a running URL: use `LHCI_BUILD_CONTEXT__CURRENT_BRANCH_URL` pointing at Vercel preview URL, or run `next build && next start` in CI and test `localhost:3000`.
- Use `@lhci/cli` (`lhci autorun`). Add as a dev dependency at root workspace level.
- Threshold: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 80.
- Non-blocking on first run (assert category `warn` → fail only when below 70). Tighten to `error` thresholds post-launch.

---

## 3. Phase 8B — Accessibility & SEO

### 3B.1 — eslint-plugin-jsx-a11y

**Context:** `eslint-config-next/core-web-vitals` enables jsx-a11y with a reduced ruleset (`recommended`). Installing the plugin directly lets us override to `strict` or add specific rules that next's config disables.

**Modified files:**
| File | Change |
|---|---|
| `apps/web/package.json` | Add `eslint-plugin-jsx-a11y` devDependency |
| `apps/web/eslint.config.mjs` | Import plugin and extend with `strict` preset; override any rules that conflict with existing patterns |

**Rule overrides to note:**

- `jsx-a11y/no-autofocus`: OFF — dialog auto-focus is correct UX per `@radix-ui` Dialog spec.
- `jsx-a11y/click-events-have-key-events`: already met in interactive elements; canvas nodes use React Flow's pointer events (not raw `onClick` without keyboard handlers) — keep as `warn` initially.

---

### 3B.2 — WCAG 2.1 AA color contrast fixes

**Affected tokens in `apps/web/src/app/globals.css`:**

| Token                        | Current           | Issue                                        | Fix                                                                      |
| ---------------------------- | ----------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `--muted-foreground` (light) | `hsl(240 4% 46%)` | ~4.24:1 on white — FAILS                     | `hsl(240 4% 37%)` → ~5.8:1                                               |
| `--destructive` (light)      | `hsl(0 84% 60%)`  | ~3.55:1 on white background for text — FAILS | `hsl(0 84% 38%)` → ≥4.5:1 (only applied to text; the button bg can stay) |

**Note on destructive:** The destructive token is used both as a button background (white text on red) and as a text color. The button (white text on `hsl(0 84% 60%)`) passes (~3.55:1 — Large Text passes at 3:1; ensure buttons use `font-size ≥ 18px` or bold ≥14px, otherwise tighten). The text-color usage (inline error text) must use the darker value. Solution: introduce `--destructive-text: hsl(0 84% 38%)` and apply it only to text usages.

---

### 3B.3 — Skip navigation link

**New file:** `apps/web/src/shared/components/SkipToContent.tsx`

A `<a href="#main-content">` link that is `sr-only` by default, becomes visible on focus (standard skip-link pattern). Styled with Tailwind `focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2`.

**Modified file:** `apps/web/src/app/layout.tsx`

- Insert `<SkipToContent />` as the first child in `<body>`.
- Add `id="main-content"` to the main content wrapper in the dashboard layout.

---

### 3B.4 — aria-live drag announcer for canvas

**New file:** `apps/web/src/features/spatial-canvas/components/CanvasDragAnnouncer.tsx`

A hidden `<div aria-live="polite" aria-atomic="true" className="sr-only" />` that updates its text content on drag start/stop events.

**Implementation strategy:**

- Use a `ref` to the div element; imperatively set `textContent` (avoids React re-render on every drag frame).
- Wire to React Flow's `onNodeDragStart` / `onNodeDragStop` callbacks already present in `RoomCanvas.tsx`.
- Messages: `"Moving [node title]"` on drag start, `"[node title] placed"` on drag stop.
- Render the announcer inside `RoomCanvas` alongside the existing `CanvasToolbar`.

**Modified file:** `apps/web/src/features/spatial-canvas/components/RoomCanvas.tsx`

- Import and render `CanvasDragAnnouncer`.
- Forward `ref` from drag callbacks.

---

### 3B.5 — Canvas keyboard navigation

React Flow v12 provides built-in keyboard support:

- Tab → moves focus to the next node.
- Enter/Space → selects the focused node.
- Arrow keys (with node selected) → move the node 5px (React Flow default).
- Delete/Backspace → already wired in `RoomCanvas.tsx` to delete selected nodes.

**Gaps to close:**

- Add `aria-label="Memory canvas — use Tab to navigate nodes, Enter to edit, Delete to remove"` to the React Flow wrapper `<div>` in `RoomCanvas.tsx`. React Flow renders a `<div role="application">` by default.
- Confirm `Enter` on a selected node opens `NodeEditorSheet` — wire to `onSelectionChange` + `onKeyDown` check for `Enter`.
- Add `aria-label` to the React Flow container via the `aria-label` prop on `<ReactFlow>`.

---

### 3B.6 — Per-page SEO metadata

**Strategy:** Next.js App Router `generateMetadata` (async, per-route).

**Modified files:**
| Route file | Change |
|---|---|
| `apps/web/src/app/layout.tsx` | Expand root metadata: add `openGraph` base, `twitter` base, `robots`, `keywords` |
| `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/page.tsx` | `generateMetadata` → fetch room title, return page-specific OG title/description |
| `apps/web/src/app/(dashboard)/palaces/[palaceId]/page.tsx` | `generateMetadata` → palace-specific title |
| `apps/web/src/app/(dashboard)/palaces/page.tsx` | Static metadata export |

**OG template:** `"[page name] | Memory Palace"` with description derived from entity content.

**Robots:** `index: false` for all authenticated routes (`/palaces/**`, `/settings`). `index: true` only for public pages (added in Phase 8C).

---

## 4. State management & data fetching notes

- Sentry is initialized at the module level in `sentry.{client,server,edge}.config.ts` — no React state involved.
- `CanvasDragAnnouncer` uses an imperative `ref` update — intentionally bypasses React state/TanStack Query to avoid re-render on every drag frame.
- Color contrast fixes are pure CSS — no React state.
- `generateMetadata` is a Next.js server-side async function — no client state.

---

## 5. File change summary

### Phase 8A

**New files:**

- `apps/web/sentry.client.config.ts`
- `apps/web/sentry.server.config.ts`
- `apps/web/sentry.edge.config.ts`
- `apps/web/src/instrumentation.ts`
- `lighthouse-budget.json`
- `.github/workflows/lighthouse-ci.yml`

**Modified files:**

- `apps/web/next.config.ts` — `withSentryConfig` wrapper
- `apps/web/src/shared/lib/env.ts` — Sentry DSN vars
- `apps/web/src/features/spatial-canvas/components/CanvasErrorBoundary.tsx` — `Sentry.captureException`

### Phase 8B

**New files:**

- `apps/web/src/shared/components/SkipToContent.tsx`
- `apps/web/src/features/spatial-canvas/components/CanvasDragAnnouncer.tsx`

**Modified files:**

- `apps/web/package.json` — `eslint-plugin-jsx-a11y` devDependency
- `apps/web/eslint.config.mjs` — jsx-a11y strict rules
- `apps/web/src/app/globals.css` — contrast token fixes
- `apps/web/src/app/layout.tsx` — `SkipToContent`, expanded `metadata`
- `apps/web/src/features/spatial-canvas/components/RoomCanvas.tsx` — announcer + `aria-label` on canvas
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/page.tsx` — `generateMetadata`
- `apps/web/src/app/(dashboard)/palaces/[palaceId]/page.tsx` — `generateMetadata`
- `apps/web/src/app/(dashboard)/palaces/page.tsx` — static metadata export

---

## 6. Edge cases & loading states

| Scenario                         | Handling                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `SENTRY_DSN` absent in local dev | `Sentry.init` guarded by `if (!dsn) return;` — no-op, no error thrown                                       |
| Screen reader on drag            | `CanvasDragAnnouncer` with `aria-live="polite"` — announces asynchronously, does not interrupt current read |
| High-contrast OS mode            | CSS `@media (forced-colors: active)` — rely on browser forced-colors; no custom overrides needed            |
| Reduced motion + drag announcer  | Announcer is text-only — unaffected by `prefers-reduced-motion`                                             |
| `generateMetadata` fetch failure | Fallback to static title string; never throws from metadata fn (catches DB error, returns default)          |
| Sentry session replay PII        | `maskAllText: true`, `blockAllMedia: true` in replay integration config                                     |
| Lighthouse CI — no preview URL   | Fallback: build + start Next.js in CI, test `http://localhost:3000`                                         |

---

## 7. Tests to add

| Test                                                                       | Location                                                           | Type                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| `SkipToContent` — renders `<a>` with correct `href`, visible on focus      | `src/shared/components/__tests__/SkipToContent.test.tsx`           | Vitest + RTL                  |
| `CanvasDragAnnouncer` — `textContent` updates on drag start/stop           | `spatial-canvas/components/__tests__/CanvasDragAnnouncer.test.tsx` | Vitest + RTL                  |
| Contrast token values (sanity check numeric HSL lightness)                 | `src/app/__tests__/globals.css.test.ts`                            | Vitest (regex parse CSS file) |
| `generateMetadata` for room page — returns correct title from fetched data | `rooms/__tests__/room-metadata.test.ts`                            | Vitest + mock                 |

---

_This document is the authoritative blueprint for Phase 8A/8B. No application code will be written until this plan is explicitly approved._
