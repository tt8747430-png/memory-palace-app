'use client';

import { useSyncExternalStore } from 'react';

/**
 * Room inspector open/close + selected tab. Mirrors useSidebarCollapsed — a
 * single external store keeps the toggle in sync between the page header and
 * the inspector panel without prop drilling.
 */

const OPEN_KEY = 'mp:room-inspector-open';
const TAB_KEY = 'mp:room-inspector-tab';
const EVENT = 'mp:room-inspector-change';

export type InspectorTab = 'overview' | 'activity';

function readOpen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(OPEN_KEY) !== '0';
  } catch {
    return false;
  }
}

function readTab(): InspectorTab {
  if (typeof window === 'undefined') return 'overview';
  try {
    const v = window.localStorage.getItem(TAB_KEY);
    return v === 'activity' ? 'activity' : 'overview';
  } catch {
    return 'overview';
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

function getServerOpen(): boolean {
  return false;
}
function getServerTab(): InspectorTab {
  return 'overview';
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (Safari private mode, quota).
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useRoomInspector(): {
  open: boolean;
  tab: InspectorTab;
  toggle: () => void;
  setOpen: (next: boolean) => void;
  setTab: (next: InspectorTab) => void;
} {
  const open = useSyncExternalStore(subscribe, readOpen, getServerOpen);
  const tab = useSyncExternalStore(subscribe, readTab, getServerTab);
  return {
    open,
    tab,
    setOpen: (next) => write(OPEN_KEY, next ? '1' : '0'),
    setTab: (next) => write(TAB_KEY, next),
    toggle: () => write(OPEN_KEY, readOpen() ? '0' : '1'),
  };
}
