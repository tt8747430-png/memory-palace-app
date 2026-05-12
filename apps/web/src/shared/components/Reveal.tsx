'use client';

import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';
import { useReveal } from '@/shared/hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  className?: string;

  delayMs?: number;
}

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
