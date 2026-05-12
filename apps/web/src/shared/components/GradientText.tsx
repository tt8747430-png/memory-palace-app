import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';

export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('gradient-text', className)}>{children}</span>;
}
