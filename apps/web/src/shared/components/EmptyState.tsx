import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  headingLevel?: 2 | 3 | 4;
  /**
   * Set to true when the empty state is rendered as the result of a live data
   * change (e.g. after a refetch returns no rows) and should be announced.
   * For first-paint empty states, leave undefined — there's nothing to
   * "announce" since the user hasn't done anything yet.
   */
  announce?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  headingLevel = 2,
  announce,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  const liveRegionProps = announce
    ? { role: 'status' as const, 'aria-live': 'polite' as const }
    : {};
  return (
    <div
      {...liveRegionProps}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 px-4 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 text-5xl" aria-hidden>
          {icon}
        </div>
      ) : null}
      <Heading className="text-lg font-semibold">{title}</Heading>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 w-full md:w-auto">{action}</div> : null}
    </div>
  );
}
