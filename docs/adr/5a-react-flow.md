# ADR 5A-001: Spatial Canvas Library — @xyflow/react

**Status:** Accepted for Phase 5A

## Context

Phase 5 introduces the core spatial canvas: a 2D surface where users drag memory nodes freely within a room. The canvas must support:

- Pointer-event-driven drag-and-drop for node repositioning
- Pan and zoom of the viewport
- Custom node shapes and content rendering (text, images, links)
- Edge connections between nodes (future)
- Stable, testable node coordinates persisted to Postgres

The canvas is a client-only concern (no SSR needed), but must integrate cleanly with the existing Next.js App Router structure.

## Options considered

### 1. Raw SVG / Canvas 2D API + custom drag logic

Full control, zero dependency weight. In practice, drag-and-drop with correct hit-testing, pointer capture, viewport transforms, touch support, and accessible keyboard nav amounts to ~3–5 kloc of hardened code. Maintenance burden is high; accessibility is rarely done correctly. **Rejected.**

### 2. D3 + React

D3 owns the DOM when used canonically, conflicting with React's virtual DOM. The `react-d3` pattern (D3 for math, React for rendering) works but requires significant glue code for drag events, zoom, and selection. No built-in node/edge abstraction — everything is custom. **Rejected.**

### 3. Konva / `react-konva`

Canvas-based (not SVG), so DOM accessibility is absent. Custom node content (rich text, images) requires Konva's own image/text APIs rather than arbitrary React JSX. Harder to integrate with Radix/shadcn popover overlays. **Rejected.**

### 4. `@xyflow/react` (React Flow v12+)

React Flow is the only production-grade flow/canvas library that renders nodes as real React components inside a standard DOM tree. Key attributes:

- Nodes are arbitrary JSX — any shadcn primitive, image, or form can live inside a node
- Built-in `useNodesState` / `useEdgesState`, `onNodeDragStop` callback, `fitView`
- Panning and zooming handled internally; controllable via `useReactFlow()` imperative handle
- Written in TypeScript; all `NodeProps<T>`, `EdgeProps`, `Handle` types are first-class
- Active maintenance, React 19 support confirmed in v12 changelog
- `@xyflow/react` is the v12 rename of `reactflow`; the old package is deprecated

The surface area added to the bundle is ~80 KB gzip (including the required CSS). That is acceptable for a route that is only reached after authentication. **Selected.**

## Decision

**Use `@xyflow/react` (v12+) as the sole canvas library.**

The package is installed only in `apps/web/` (not hoisted to the monorepo root), keeping `packages/db` and `packages/ui` free of the canvas dependency.

## Implementation notes

- Feature directory: `apps/web/src/features/spatial-canvas/`
- The canvas route is a Client Component tree; the page Server Component fetches initial node data, passes it as props, then the canvas hydrates. No client-side Supabase calls.
- `ReactFlow` must be wrapped in a `<ReactFlowProvider>` when `useReactFlow()` is used outside the immediate `<ReactFlow>` child.
- A `CanvasErrorBoundary` (class component) wraps only the canvas subtree so a crash does not unmount the sidebar or room header.
- Required stylesheet: `import '@xyflow/react/dist/style.css'` in the canvas layout or the page component — not in `globals.css`, keeping the import co-located with the feature.
- Drag-drop E2E tests require Playwright — JSDOM cannot simulate `pointerdown`/`pointermove` sequences reliably. Vitest covers unit logic (coordinate maths, schema validation); Playwright covers drag interaction.

## Consequences

- `pnpm add @xyflow/react --filter @memory-palace/web` adds ~80 KB gzip to the canvas route.
- React Flow's internal `zustand` usage (it uses Zustand internally for its own state) is a separate instance from our application-level Zustand store — no conflict, different store factories.
- Edge connections (node → node links) are deferred to Phase 5D; `edges={[]}` is passed initially.
