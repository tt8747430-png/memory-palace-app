# Performance Budget & Optimization Strategy — Memory Palace App

This document defines the performance targets, measurement tools, and implementation strategies for the Memory Palace application.

---

## Table of Contents

1. [Performance Budget](#1-performance-budget)
2. [Canvas Node Virtualization](#2-canvas-node-virtualization)
3. [Debounced Auto-Save Strategy](#3-debounced-auto-save-strategy)
4. [Image Optimization Pipeline](#4-image-optimization-pipeline)
5. [Bundle Analysis](#5-bundle-analysis)
6. [Lighthouse CI GitHub Action](#6-lighthouse-ci-github-action)

---

## 1. Performance Budget

The following targets must be met on the production build. CI will fail if any target is regressed by more than 10%.

| Metric                         | Target                   | Tool to Enforce             |
| ------------------------------ | ------------------------ | --------------------------- |
| First Load JS                  | < 200KB gzipped          | `@next/bundle-analyzer`     |
| Largest Contentful Paint (LCP) | < 2.5s                   | Lighthouse CI               |
| First Input Delay (FID)        | < 100ms                  | Lighthouse CI               |
| Cumulative Layout Shift (CLS)  | < 0.1                    | Lighthouse CI               |
| Canvas Frame Rate              | Stable 60fps during drag | Sentry Long Task monitoring |
| Time to Interactive (TTI)      | < 3.5s                   | Lighthouse CI               |

### Lighthouse Score Minimums

| Category       | Minimum Score |
| -------------- | ------------- |
| Performance    | 85            |
| Accessibility  | 90            |
| Best Practices | 90            |
| SEO            | 80            |

---

## 2. Canvas Node Virtualization

The React Flow canvas must be configured to render **only the nodes visible in the current viewport**. Without virtualization, a room with 500+ nodes would attempt to render all nodes simultaneously, causing frame drops and memory exhaustion.

### React Flow Built-In Virtualization

React Flow includes built-in virtualization. Enable it for rooms that may contain large numbers of nodes:

```typescript
import ReactFlow from 'reactflow';

<ReactFlow
  nodes={nodes}
  edges={edges}
  onlyRenderVisibleElements={true}  // Enable for rooms with 100+ nodes
  nodeExtent={[
    [-10000, -10000],  // Top-left boundary
    [10000, 10000],    // Bottom-right boundary
  ]}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
/>
```

### Guidelines

| Room Size    | Configuration                                                      |
| ------------ | ------------------------------------------------------------------ |
| < 50 nodes   | Virtualization optional                                            |
| 50–200 nodes | Enable `onlyRenderVisibleElements`                                 |
| 200+ nodes   | Enable `onlyRenderVisibleElements` + monitor with Sentry Long Task |
| 500+ nodes   | Consider paginating nodes by spatial region                        |

### Why `nodeExtent`?

Setting `nodeExtent` prevents React Flow from computing layout for an unbounded canvas. Without it, panning to extreme coordinates can trigger unnecessary re-renders across all nodes.

---

## 3. Debounced Auto-Save Strategy

Saving on every canvas event would generate hundreds of database writes per second during active editing. The following strategy ensures responsive UX while minimizing server load.

### Save Timing by Action

| Action                      | Strategy                       | Timing                        |
| --------------------------- | ------------------------------ | ----------------------------- |
| Node drag (position change) | Save on drop (not during drag) | Immediate on `dragend`        |
| Node text editing           | Debounced save                 | 500ms after last keystroke    |
| Node resize                 | Debounced save                 | 300ms after resize ends       |
| Multi-node selection + drag | Batch save on drop             | Immediate, single transaction |

### Implementation

Install `use-debounce`:

```bash
pnpm add use-debounce
```

Debounced save hook for node content:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  (nodeId: string, content: string) => {
    updateNodeContent({ nodeId, content }); // Server Action
  },
  500, // ms
);
```

Position save on drop (no debounce needed — fires once):

```typescript
const onNodeDragStop = useCallback(
  (event: React.MouseEvent, node: Node) => {
    batchUpdateNodes({
      roomId,
      updates: [{ id: node.id, position_x: node.position.x, position_y: node.position.y }],
    });
  },
  [roomId],
);
```

Multi-node batch save:

```typescript
const onSelectionDragStop = useCallback(
  (event: React.MouseEvent, nodes: Node[]) => {
    batchUpdateNodes({
      roomId,
      updates: nodes.map((n) => ({
        id: n.id,
        position_x: n.position.x,
        position_y: n.position.y,
      })),
    });
  },
  [roomId],
);
```

### What NOT to Save During Drag

During drag, coordinates live exclusively in Zustand. No Server Action is called until `dragend`. This is what enables 60fps performance — zero server round-trips during motion.

---

## 4. Image Optimization Pipeline

Room background images and node image attachments follow this pipeline to minimize bandwidth and rendering time.

### Pipeline Steps

1. **Upload** — User uploads image → Supabase Storage (raw file, up to 5MB). Validated server-side (see `SECURITY.md` §4).
2. **Transformation** — Server generates optimized variants via Supabase Image Transformations (built into Supabase Storage).
3. **Delivery** — Canvas receives optimized URL with size parameters:
   ```
   https://<ref>.supabase.co/storage/v1/render/image/public/rooms/bg.jpg
     ?width=300&height=200&format=webp&quality=80
   ```
4. **Lazy Loading** — Images lazy-load only when their parent node enters the React Flow viewport (controlled by `onlyRenderVisibleElements`).
5. **Placeholder** — A blur-hash placeholder is shown during image load to prevent layout shift (CLS).

### Next.js Image Component

Use `next/image` for any image rendered outside of the React Flow canvas (e.g., thumbnails in the dashboard):

```typescript
import Image from 'next/image';

<Image
  src={optimizedUrl}
  alt={room.name}
  width={300}
  height={200}
  placeholder="blur"
  blurDataURL={room.blurHash}
  loading="lazy"
/>
```

### Inside React Flow Nodes

React Flow nodes are `div` elements. Use a standard `<img>` tag with `loading="lazy"` for images inside node renderers, as `next/image` cannot optimize images inside canvas nodes at build time.

---

## 5. Bundle Analysis

Run the Next.js bundle analyzer to identify oversized packages and find code-splitting opportunities:

```bash
ANALYZE=true pnpm --filter web build
```

This opens a visual treemap in the browser showing the size contribution of every module in the client and server bundles.

### How to Interpret the Results

- **Blue blocks** = Node modules (third-party dependencies)
- **Green blocks** = Application code
- Large blue blocks that are unexpectedly present on the client bundle may indicate:
  - A server-only library accidentally imported in a client component
  - A large utility library that could be replaced with a smaller alternative

### Common Optimizations

| Issue                                  | Solution                                            |
| -------------------------------------- | --------------------------------------------------- |
| Large date library (e.g., `moment.js`) | Replace with `date-fns` (tree-shakeable)            |
| Full `lodash` import                   | Use `lodash-es` with named imports                  |
| Icons library bundling all icons       | Use individual icon imports                         |
| Database client in client bundle       | Move to Server Actions or ensure it's `server-only` |

---

## 6. Lighthouse CI GitHub Action

Add the following job to `.github/workflows/ci.yml` to automatically audit performance on every PR against the preview deployment:

```yaml
lighthouse:
  name: Lighthouse Performance Audit
  runs-on: ubuntu-latest
  needs: [lint, typecheck]
  steps:
    - uses: actions/checkout@v4
    - uses: treosh/lighthouse-ci-action@v12
      with:
        urls: |
          ${{ env.PREVIEW_URL }}
        budgetPath: ./lighthouse-budget.json
        uploadArtifacts: true
```

### `lighthouse-budget.json`

Create this file in the repository root to define the performance budget enforced by Lighthouse CI:

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

### How It Works

1. A PR is opened → CI runs `lint` and `typecheck` jobs
2. Once those pass, Vercel creates a preview deployment
3. The `lighthouse` job runs against the preview URL
4. Results are uploaded as CI artifacts (viewable in the GitHub Actions tab)
5. If any budget is exceeded, the job fails and blocks the merge

> **Note:** The `PREVIEW_URL` environment variable must be populated by the `deploy.yml` workflow (Vercel provides this via the Vercel GitHub integration).

---

## Figma 2026 polish — performance posture

The dashboard / practice polish from [`docs/plans/IMPLEMENTATION_APP_PLAN_FIGMA.md`](../plans/IMPLEMENTATION_APP_PLAN_FIGMA.md) is **bundle-neutral**:

- Sparkline, area chart with hover tooltip, mastery rings, and arc donut are all **pure SVG with `currentColor`** — no Recharts, no D3.
- Slide-to-confirm reuses the framer-motion already installed for `useSwipeNavigation`; no `react-swipeable` or `@use-gesture/react`.
- Workspace switcher reuses palaces already fetched server-side in the dashboard layout — no new round-trip.
- `getPracticeStats()` gains an additive `mastery` field derived in the same query; no extra request.
- New animations gate via CSS `@media (prefers-reduced-motion: reduce)` or the global `MotionConfig reducedMotion="user"` — no JS `useReducedMotion()` checks.

Lighthouse budgets (`lighthouse-budget.json`) remain the gate.
