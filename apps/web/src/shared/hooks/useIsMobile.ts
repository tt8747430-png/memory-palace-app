'use client';

import { useEffect, useState } from 'react';

/** Tailwind `md` breakpoint in pixels (768px). */
const MD_BREAKPOINT = 768;

/**
 * Returns `true` when the viewport is narrower than the `md` breakpoint.
 *
 * - Returns `false` on the server to prevent hydration mismatch.
 * - Subscribes to `matchMedia` changes so it responds to resize/orientation.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
    // Use a callback wrapper so the initial sync is treated as a subscription
    // update rather than a direct setState call (satisfies the React Compiler rule).
    const sync = () => setIsMobile(mql.matches);
    mql.addEventListener('change', sync);
    sync();
    return () => mql.removeEventListener('change', sync);
  }, []);

  return isMobile;
}
