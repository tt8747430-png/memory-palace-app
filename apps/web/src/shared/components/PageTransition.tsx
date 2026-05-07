'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        className="motion-reduce:transition-none motion-reduce:animate-none"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
