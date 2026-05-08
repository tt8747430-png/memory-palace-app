'use client';

import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';
import { useReveal } from '@/shared/hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms — applied as `transition-delay` inline style. */
  delayMs?: number;
}

/**
 * Tiny client wrapper that pairs `useReveal` with the `.reveal-up` class.
 * Keeps the marketing page itself an RSC — only the wrapper opts into the
 * client boundary so the IntersectionObserver can run.
 */
export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn('reveal-up', className)}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
