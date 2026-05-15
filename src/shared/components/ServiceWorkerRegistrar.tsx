'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = (): void => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* registration is best-effort */
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(register, { timeout: 2000 });
      return () => window.cancelIdleCallback(handle);
    }

    const timer = setTimeout(register, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
