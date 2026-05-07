'use client';

import { usePathname } from 'next/navigation';
import { m } from 'framer-motion';

// AnimatePresence is intentionally absent: mode="wait" is incompatible with
// Next.js App Router concurrent rendering — usePathname() updates optimistically
// (before RSC resolves), causing exit/enter cycles against stale content.
// MotionConfig reducedMotion="user" (set in MotionProvider) zeroes the duration
// automatically for users who prefer reduced motion, so no local check is needed.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <m.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  );
}
