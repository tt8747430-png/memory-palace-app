'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    let ticking = false;

    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      setProgress(ratio);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-foreground/5"
    >
      <div
        className="h-full origin-left bg-linear-to-r from-foreground/40 via-foreground/80 to-foreground/40"
        style={{
          transform: `scaleX(${progress})`,
          transition: reduced ? 'none' : 'transform 120ms linear',
        }}
      />
    </div>
  );
}
