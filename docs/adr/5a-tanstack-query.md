# ADR 5A-003: Server State Management — TanStack Query

**Status:** Accepted for Phase 5A

## Context

The canvas page needs to:

1. **Load** the room's nodes from Postgres on mount (initial hydration)
2. **Persist** node position changes after drag-drop (mutation)
3. **Optimistically update** the UI so the node does not snap back while the server round-trip completes
4. **Invalidate / refetch** when a node is created, deleted, or its metadata changes
5. **Avoid double-fetching** when the user navigates back to a room they recently visited

Today, server actions return data directly; the caller is responsible for re-fetching. This is fine for low-frequency operations (palace CRUD). For the canvas — where dozens of mutations can fire in a session — a caching and mutation layer prevents redundant round-trips and keeps the UI responsive.

## Options considered

### 1. Manual `useEffect` + `useState` + re-fetch after each action

No dependency weight. In practice: every component that needs nodes must manage its own loading/error/stale state, manually coordinate with sibling mutations, and re-fetch eagerly after every server action. This is the pattern TanStack Query was built to replace. **Rejected.**

### 2. Next.js `unstable_cache` / `revalidatePath`

Excellent for Server Components, but the canvas is a fully client-rendered subtree — Server Component caching does not help here. `revalidatePath` triggers a full server re-render; it cannot do optimistic updates. **Rejected for canvas; remains the right choice for the dashboard's palace list.**

### 3. SWR (Vercel)

Smaller API surface than TanStack Query. Works well for simple GET-then-display use cases. Lacks first-class mutation handling (`mutate` is manual), has no built-in optimistic update rollback, and its TypeScript generics are less ergonomic than TanStack Query v5's fully inferred types. **Not selected (viable alternative for simpler pages).**

### 4. TanStack Query v5 (`@tanstack/react-query`)

- `useQuery` for cached fetches — stale-while-revalidate by default; `staleTime` configurable per query
- `useMutation` with `onMutate` (optimistic), `onError` (rollback), `onSettled` (refetch) lifecycle hooks — the canonical pattern for drag-drop persistence
- `QueryClient.invalidateQueries` cascades invalidation to all watchers of a key — one save invalidates both the canvas node list and the sidebar node count badge
- v5 (released Nov 2023) removes the overloaded `useQuery(key, fn, opts)` signature in favour of the options-object form; better React 19 compatibility; `suspense: true` is stable
- ~13 KB gzip; tree-shakes well
- Works with server actions as the `queryFn` / `mutationFn` — no REST endpoint needed

**Selected.**

## Decision

**Use TanStack Query v5 (`@tanstack/react-query`) for all server-state caching on the canvas.**

Non-canvas server data (dashboard palace list, settings) continues to use direct server action calls with `revalidatePath` — TanStack Query is not introduced globally, only where the cache/optimistic-update pattern pays off.

## Implementation notes

- `QueryClientProvider` wraps only the canvas subtree (or the `(dashboard)` layout if the palette badge also needs query state) — not the root layout
- Query key convention: `['rooms', roomId, 'nodes']` — hierarchical so `invalidateQueries({ queryKey: ['rooms', roomId] })` invalidates all room-scoped data
- The initial node list is fetched server-side in the page Server Component and passed as `initialData` to `useQuery`, preventing a client-side waterfall on first paint
- `staleTime: 30_000` (30 s) on the nodes query — nodes do not change unless the current user drags them, so background refetching is low-value
- Drag-drop mutation: `useMutation({ mutationFn: batchUpdateNodes, onMutate: optimisticPositionUpdate, onError: rollbackToSnapshot, onSettled: () => queryClient.invalidateQueries(...) })`
- The `batchUpdateNodes` server action batches all `onNodeDragStop` deltas that accumulate within a 300 ms debounce window, reducing server action invocations during rapid sequential drags

## Consequences

- Adds ~13 KB gzip to the canvas route bundle.
- `QueryClientProvider` must not be placed at the root layout — it is a client boundary, and placing it at the root forces every page into the client bundle. Co-locate it with the canvas layout or a `Providers` component scoped to `(dashboard)`.
- Yjs (Phase 5C) will sit alongside TanStack Query: Yjs owns real-time collaborative position state; TanStack Query owns the authoritative snapshot fetched on mount and written on disconnect. The two are reconciled via the `onSync` Yjs event triggering `queryClient.invalidateQueries`.
