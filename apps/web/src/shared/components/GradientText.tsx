import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';

/**
 * Animated gradient-fill text. Renders an inline span with a
 * `linear-gradient` background clipped to the text and a slow
 * left-to-right pan (6 s cycle). Reduced-motion users see a static
 * gradient via the `prefers-reduced-motion` rule on `.gradient-text`
 * in `globals.css`.
 *
 * Colors come from the Memory Palace marketing accent palette
 * (gold → emerald → cyan → emerald → gold) so this should only be
 * used inside `app/(marketing)/` and `features/marketing/`.
 */
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('gradient-text', className)}>{children}</span>;
}
