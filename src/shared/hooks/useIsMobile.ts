'use client';

import { useEffect, useState } from 'react';

const MD_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);

    const sync = () => setIsMobile(mql.matches);
    mql.addEventListener('change', sync);
    sync();
    return () => mql.removeEventListener('change', sync);
  }, []);

  return isMobile;
}
