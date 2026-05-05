import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  headingLevel?: 2 | 3 | 4;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      role="status"
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
