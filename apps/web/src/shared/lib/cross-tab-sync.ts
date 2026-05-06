/**
 * Cross-tab cache invalidation via the BroadcastChannel API.
 *
 * When a mutation succeeds in one tab, it broadcasts a lightweight message
 * to all other tabs on the same origin. Those tabs invalidate their TanStack
 * Query cache for the affected room, triggering a background refetch.
 *
 * This is Layer 1 of Phase 5C's sync strategy — zero-latency, no network,
 * handles the "two tabs open" use case instantly.
 *
 * @see docs/adr/5c-realtime-sync.md
 */

const CHANNEL_NAME = 'memory-palace:cache-sync';

interface InvalidateMessage {
  type: 'invalidate';
  queryKey: readonly unknown[];
}

type SyncMessage = InvalidateMessage;

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof globalThis.BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

/** Broadcast a cache invalidation to all other tabs on this origin. */
export function broadcastInvalidate(queryKey: readonly unknown[]): void {
  const ch = getChannel();
  if (!ch) return;
  const message: SyncMessage = { type: 'invalidate', queryKey: [...queryKey] };
  ch.postMessage(message);
}

/** Subscribe to cross-tab invalidation messages. Returns an unsubscribe fn. */
export function onCrossTabInvalidate(callback: (queryKey: readonly unknown[]) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<SyncMessage>) => {
    if (event.data?.type === 'invalidate') {
      callback(event.data.queryKey);
    }
  };
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}
