const CHANNEL_NAME = 'memory-palace:cache-sync';

interface InvalidateMessage {
  type: 'invalidate';
  queryKey: readonly unknown[];
}

type SyncMessage = InvalidateMessage;

const globalForChannel = globalThis as unknown as {
  __mpBroadcastChannel?: BroadcastChannel;
};

function getChannel(): BroadcastChannel | null {
  if (typeof globalThis.BroadcastChannel === 'undefined') return null;
  globalForChannel.__mpBroadcastChannel ??= new BroadcastChannel(CHANNEL_NAME);
  return globalForChannel.__mpBroadcastChannel;
}

export function broadcastInvalidate(queryKey: readonly unknown[]): void {
  const ch = getChannel();
  if (!ch) return;
  const message: SyncMessage = { type: 'invalidate', queryKey: [...queryKey] };
  ch.postMessage(message);
}

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
