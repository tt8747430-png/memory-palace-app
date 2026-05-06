# ADR: Phase 2–5D Modernization Refactor

**Status:** Accepted  
**Date:** 2026-05-06  
**Scope:** `apps/web/src/`, `packages/db/`

---

## Context

A full audit of Phases 2–5D identified seven concrete issues: dead code, two HMR memory leaks, a name collision that could mask a React Flow bug, redundant memoization inconsistent with the project's React Compiler setup, a DRY violation with diverging magic numbers, and an inconsistent cache-invalidation strategy across server actions. None were regressions in production, but each increased cognitive overhead or posed a latent risk in development.

---

## Issues Identified and Fixes Applied

### 1. Dead code — `channelRef` in `useRealtimeNodes`

**Flaw:** `useRef<RealtimeChannel | null>(null)` was imported, declared, written on subscribe, and nullified on cleanup — but never read anywhere. The channel object was already captured in the `useEffect` closure and passed directly to `supabase.removeChannel(channel)`.

**Fix:** Removed the `useRef` declaration and all writes to `channelRef`. The cleanup closure captures `channel` directly, which is correct and sufficient.

---

### 2. HMR memory leak — `supabase-browser.ts`

**Flaw:** `let browserClient: SupabaseClient | null = null` was declared at module scope. Next.js HMR in development re-executes the module on every hot reload, resetting the variable to `null` and creating a new `SupabaseClient` (and a new WebSocket connection to Supabase Realtime) while the old one remains connected and unreferenced. This is the same category of bug the `ratelimit.ts` module already solved with `globalThis.__mpRedis`.

**Fix:** Moved the singleton to `globalThis.__mpSupabaseBrowser`. Pattern is identical to the existing `ratelimit.ts` solution. Production is unaffected (no HMR).

---

### 3. HMR memory leak — `cross-tab-sync.ts`

**Flaw:** `let channel: BroadcastChannel | null = null` at module scope suffered the same HMR re-execution problem. Each reload created a new `BroadcastChannel` while the old one remained open and attached to its event listeners, causing duplicate `message` events in development.

**Fix:** Moved the singleton to `globalThis.__mpBroadcastChannel` using the `??=` nullish coalescing assignment idiom for a single-line guard. Matches the established pattern.

---

### 4. Name collision — `fitView` boolean in `RoomCanvas`

**Flaw:** `const fitView = initialNodes.length > 0` in `InnerCanvas` used the name `fitView`, which is the canonical name of the React Flow imperative API (`useReactFlow().fitView`). Although `fitView` the function was not destructured in `InnerCanvas`'s own scope (only `screenToFlowPosition` was), the name collision would confuse a reader into thinking the boolean was a function, and would silently shadow the React Flow function if the destructuring were ever extended.

**Fix:** Renamed the boolean to `shouldFitView`. Updated the prop reference on `<ReactFlow fitView={shouldFitView}>`.

---

### 5. Redundant memoization — `RoomCanvas`

**Flaw:** `RoomCanvas.tsx` applied `useCallback` to `onPaneContextMenu` and `useMemo` to `nodeActions` and `flowNodes`, while comments elsewhere in the codebase (notably `useRoomNodeMutations.ts`) explicitly state "React Compiler auto-memoizes these closures — no useCallback needed." The Babel React Compiler plugin is enabled in `next.config.ts`. Using manual memoization alongside the compiler is redundant and inconsistent — it makes it harder to tell which decisions are load-bearing and which are noise.

**Fix:** Removed `useCallback` from `onPaneContextMenu` and `useMemo` from `nodeActions` and `flowNodes`. Removed the unused `useCallback` and `useMemo` imports. React Compiler handles memoization uniformly.

---

### 6. DRY violation — `handleAddNode` in `CanvasToolbar` and `CanvasFab`

**Flaw:** Both components contained an identical local `handleAddNode` function that (1) queried the DOM for `[data-testid="canvas-container"]`, (2) computed the screen-space centre, and (3) called `addNode.mutate`. The implementations diverged silently: `CanvasToolbar` used a fallback of `{cx: 400, cy: 300}` while `CanvasFab` used `{cx: 200, cy: 300}`, meaning a node created from the toolbar and a node created from the FAB landed at different canvas positions when the container rect was unavailable.

**Fix:** Extracted `getCanvasCenterFlowPos(screenToFlowPosition)` into `spatial-canvas/lib/canvasUtils.ts`. Both components now call the shared helper, eliminating the divergence. The canonical fallback is `{x: 400, y: 300}`.

As a related fix in `RoomCanvas.tsx`, the `onPaneContextMenu` handler previously also queried `document.querySelector('[data-testid="canvas-container"]')`. Since the container div is in the same component, it was replaced with a `containerRef` (`useRef<HTMLDivElement>`) attached directly to the div — no DOM query needed.

---

### 7. Inconsistent `revalidatePath` in `createNode`

**Flaw:** `createNode` called `revalidatePath('/palaces/${palaceId}/rooms/${roomId}')` and `revalidatePath('/')`. All other node mutations (`deleteNode`, `updateNode`, `updateNodePosition`, `batchUpdateNodePositions`) explicitly omit `revalidatePath`, with `deleteNode` documenting why: "the canvas owns its state through TanStack Query's optimistic cache + invalidateQueries."

The two `revalidatePath` calls in `createNode` were also effective no-ops: the room page reads cookies via `createSupabaseFromCookies`, making it a dynamically rendered RSC that bypasses the Next.js full-route cache entirely. `revalidatePath` only purges the full-route cache; it has no effect on pages that are already `dynamic = 'force-dynamic'`.

Additionally, now that `palaceId` was only used to build the `revalidatePath` string, the `innerJoin` select was fetching an unnecessary column. Removing it simplifies the query.

**Fix:** Removed `revalidatePath` imports and calls from `createNode`. Updated the transaction's `select` to omit `palaceId`. Node cache coherence remains fully handled by TanStack Query's `invalidateQueries` on `onSettled`.

---

## Unchanged Decisions

- `SelectionToolbar` fires one `removeNode` mutation per selected node rather than a batch. A `batchDeleteNodes` server action would require a new schema and Postgres multi-row soft-delete. The current approach is documented behavior, not a bug. TanStack Query serializes the invalidations within a tick.
- The `isLoading` guard in `InnerCanvas` is effectively unreachable when `initialData` is provided, but it is a correct defensive guard for the case where `RoomCanvas` is rendered without `initialData`. Left as-is.
- The class-based `CanvasErrorBoundary` remains: React does not yet provide a hook-based equivalent that can catch render errors.

---

## Consequences

- Eliminates two WebSocket/BroadcastChannel leaks that caused duplicate realtime events in development hot-reload sessions.
- Removes ~30 lines of redundant memoization from the canvas hot path.
- Ensures "add node" always places nodes at the same canvas position regardless of which affordance (toolbar or FAB) the user triggers.
- Aligns all node mutations to a single cache-invalidation strategy: TanStack Query only.
