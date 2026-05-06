# ADR: Phase 5C — Realtime Sync & Offline

**Status:** Accepted  
**Date:** 2026-05-06  
**Deciders:** Architecture review

## Context

Phase 5C requires realtime synchronization and offline resilience for the spatial canvas. The aspirational roadmap specified Yjs CRDTs with `y-supabase` and `y-indexeddb`.

### Problem Statement

When a user edits nodes in one tab/device, the changes should appear in other open sessions without manual refresh. Additionally, if the user goes offline, edits should not be lost.

### Constraints

- Memory Palace is a **single-user** app (no multi-user collaborative editing)
- The existing data flow is: Zustand (60fps drag) → TanStack Query (optimistic mutations) → Server Actions (Drizzle) → Postgres
- All writes already go through Server Actions with RLS — there's no client-side Supabase client today

## Decision

**Reject Yjs/CRDT. Use Supabase Realtime Postgres Changes + BroadcastChannel API instead.**

### Rationale

| Factor                | Yjs/CRDT                                                                                                                                                                 | Supabase Realtime + BroadcastChannel                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `y-supabase` maturity | No production-ready npm package exists. Community projects are experimental (last updated 2023).                                                                         | Supabase Realtime is a first-party, production-grade feature.                                                                        |
| Complexity            | Requires: Yjs doc management, custom provider, IndexedDB persistence, CRDT merge logic, binary blob storage in Postgres, dual state ownership (Yjs + TanStack Query).    | Adds a single browser-side Supabase client and one `useEffect` per canvas mount. Zero state ownership changes.                       |
| Bundle impact         | `yjs` (25KB) + `y-indexeddb` (8KB) + custom provider (~5KB) = ~38KB gzipped.                                                                                             | `@supabase/supabase-js` is already a dev dependency via `@supabase/ssr`. Browser client creation is ~0KB incremental.                |
| Architecture fit      | Requires fundamentally restructuring the data flow — Yjs becomes the source of truth, TanStack Query becomes a read-through cache, Server Actions become sync endpoints. | Postgres remains the source of truth. TanStack Query's `invalidateQueries` is the only integration point. Zero architecture changes. |
| Offline               | Full offline-first via IndexedDB.                                                                                                                                        | Optimistic mutations + `navigator.onLine` guard + queue. Not full CRDT merge, but sufficient for single-user.                        |
| Multi-user (future)   | Designed for it.                                                                                                                                                         | Would need Broadcast channels. But multi-user is not in any concrete phase.                                                          |

**The Yjs approach is over-engineered for single-user sync.** It would introduce a second source of truth (the Yjs doc) alongside Postgres, creating a state reconciliation problem that doesn't exist today. The simpler approach preserves the existing architecture and achieves the same user-visible outcome.

## Architecture

### Layer 1: Cross-Tab Sync (BroadcastChannel API)

Same-device, zero-latency. When a mutation succeeds in one tab, a `BroadcastChannel` message tells other tabs to `invalidateQueries`. This is instant (no network) and handles 99% of the "two tabs open" use case.

```
Tab A: mutation succeeds → postMessage('invalidate', { roomId })
Tab B: onmessage → queryClient.invalidateQueries(['rooms', roomId, 'nodes'])
```

### Layer 2: Cross-Device Sync (Supabase Realtime)

For multi-device scenarios (phone + laptop), subscribe to Postgres Changes on the `nodes` table filtered by `room_id`. When the WAL fires, invalidate the TanStack Query cache.

```
Device A: Server Action → Postgres UPDATE
Postgres WAL → Supabase Realtime → WebSocket → Device B
Device B: on('postgres_changes') → invalidateQueries
```

### Layer 3: Offline Resilience

- **Detection:** `navigator.onLine` + `window.addEventListener('online'/'offline')`
- **During offline:** Optimistic mutations still work (TanStack Query cache updates instantly). Server Action calls fail silently — mutations are queued by TanStack Query's built-in retry logic.
- **On reconnect:** Invalidate all room queries to reconcile with the server. Stale optimistic data is replaced by the server truth.

### Browser-Side Supabase Client

This phase introduces the first browser-side Supabase client (`createSupabaseBrowser`). It uses the same publishable key as the server clients. It is used **only** for Realtime subscriptions — all data mutations continue through Server Actions.

## Implementation

### New Files

| File                                                      | Purpose                                |
| --------------------------------------------------------- | -------------------------------------- |
| `src/shared/lib/supabase-browser.ts`                      | Browser-side Supabase client singleton |
| `src/shared/lib/cross-tab-sync.ts`                        | BroadcastChannel wrapper               |
| `src/features/spatial-canvas/hooks/useRealtimeNodes.ts`   | Supabase Realtime subscription hook    |
| `src/features/spatial-canvas/hooks/useOfflineDetector.ts` | Online/offline status hook             |
| `src/shared/components/OfflineBanner.tsx`                 | Visual offline indicator               |

### Modified Files

| File                      | Change                                            |
| ------------------------- | ------------------------------------------------- |
| `useRoomNodeMutations.ts` | Post to BroadcastChannel on mutation success      |
| `RoomCanvas.tsx`          | Mount `useRealtimeNodes` and `useOfflineDetector` |

### What This Does NOT Do

- Does not add Yjs, y-indexeddb, or any CRDT library
- Does not change the source of truth (Postgres via Server Actions)
- Does not add a service worker or IndexedDB persistence
- Does not support multi-user collaborative editing

### Prerequisites

- The `nodes` table must be added to the `supabase_realtime` publication:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE nodes;
  ```
- This is a one-time Supabase dashboard/migration step.

## Consequences

### Positive

- Zero architecture changes — TanStack Query + Server Actions remain the canonical data flow
- Minimal bundle impact (~0KB incremental)
- Cross-tab sync is instant (no network)
- Cross-device sync leverages existing Supabase infrastructure
- Simple mental model: "mutations write to Postgres, Realtime notifies other sessions to refetch"

### Negative

- Not offline-first. If the user is offline for extended periods, mutations will fail after TanQuery retry exhaustion. This is acceptable for a web app (vs. a native app) where offline editing is a nice-to-have, not a requirement.
- If multi-user collaboration becomes a concrete requirement, this architecture would need Broadcast channels for cursor presence. That's a natural extension, not a rewrite.

### Risks

- Supabase Realtime Postgres Changes requires the table to be in the `supabase_realtime` publication. If this is missed in deployment, cross-device sync silently doesn't work. Mitigation: migration script + E2E test.
