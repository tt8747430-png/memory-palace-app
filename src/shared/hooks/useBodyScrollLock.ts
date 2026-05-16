'use client';

import { useEffect } from 'react';

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    const body = document.body;
    body.dataset.scrollLocked = 'true';
    return () => {
      delete body.dataset.scrollLocked;
    };
  }, [locked]);
}
