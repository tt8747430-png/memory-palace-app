'use client';

import { useSyncExternalStore } from 'react';

/**
 * Sidebar collapse state — persisted to localStorage so the rail/expanded
 * choice survives reloads. A plain external store is enough; no Zustand
 * needed for a single boolean. Lives at the dashboard-feature level so the
 * sidebar and shell can share it without prop drilling.
 */

const STORAGE_KEY = 'mp:sidebar-collapsed';
const EVENT = 'mp:sidebar-collapsed-change';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useSidebarCollapsed(): {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (next: boolean) => void;
} {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  return {
    collapsed,
    setCollapsed: (next) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Storage may be unavailable (Safari private mode, quota); the UI
        // still updates via the custom event.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    toggle: () => {
      const next = !read();
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // See note above.
      }
      window.dispatchEvent(new Event(EVENT));
    },
  };
}
