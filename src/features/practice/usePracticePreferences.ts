'use client';

import { useSyncExternalStore } from 'react';

export const SWIPE_ACTIONS = ['again', 'hard', 'good', 'easy', 'skip'] as const;
export type SwipeAction = (typeof SWIPE_ACTIONS)[number];

export interface PracticePreferences {
  swipeLeft: SwipeAction;
  swipeRight: SwipeAction;
}

const DEFAULTS: PracticePreferences = {
  swipeLeft: 'again',
  swipeRight: 'good',
};

const STORAGE_KEY = 'mp:practice-preferences';
const EVENT = 'mp:practice-preferences-change';

function isSwipeAction(value: unknown): value is SwipeAction {
  return typeof value === 'string' && (SWIPE_ACTIONS as readonly string[]).includes(value);
}

function read(): PracticePreferences {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULTS;
    const candidate = parsed as Record<string, unknown>;
    return {
      swipeLeft: isSwipeAction(candidate.swipeLeft) ? candidate.swipeLeft : DEFAULTS.swipeLeft,
      swipeRight: isSwipeAction(candidate.swipeRight) ? candidate.swipeRight : DEFAULTS.swipeRight,
    };
  } catch {
    return DEFAULTS;
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

function write(next: PracticePreferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function usePracticePreferences(): {
  preferences: PracticePreferences;
  setSwipeLeft: (action: SwipeAction) => void;
  setSwipeRight: (action: SwipeAction) => void;
  reset: () => void;
} {
  const preferences = useSyncExternalStore(subscribe, read, () => DEFAULTS);
  return {
    preferences,
    setSwipeLeft: (action) => write({ ...read(), swipeLeft: action }),
    setSwipeRight: (action) => write({ ...read(), swipeRight: action }),
    reset: () => write(DEFAULTS),
  };
}
