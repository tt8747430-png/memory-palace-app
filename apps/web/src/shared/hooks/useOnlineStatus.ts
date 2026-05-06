'use client';

import { useSyncExternalStore } from 'react';

/**
 * Returns the current online/offline status of the browser.
 *
 * Uses `useSyncExternalStore` for tear-free reads — the value is consistent
 * across the render tree even during concurrent rendering.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

/** Server always assumes online — the banner is client-only. */
function getServerSnapshot(): boolean {
  return true;
}
