import { cn, Skeleton } from '@memory-palace/ui';

interface CardSkeletonProps {
  /** Number of skeleton cards to render. Defaults to 3. */
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 3, className }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn('rounded-lg border bg-card p-4 space-y-3', className)}
          aria-label="Loading"
          role="status"
        >
          <Skeleton className="h-5 w-3/5" aria-hidden="true" />
          <Skeleton className="h-4 w-full" aria-hidden="true" />
          <Skeleton className="h-4 w-4/5" aria-hidden="true" />
        </div>
      ))}
    </>
  );
}
