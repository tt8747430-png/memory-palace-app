import { Skeleton } from '@memory-palace/ui';

/** Placeholder shown while the initial node list is loading.
 * Mimics the canvas dot-grid with a few ghost node cards. */
export function CanvasLoadingSkeleton() {
  return (
    <div className="relative flex h-full w-full items-start justify-start overflow-hidden rounded-xl border bg-muted/10 p-8">
      {/* Ghost dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.15)_1px,transparent_1px)] [background-size:20px_20px]"
      />

      {/* Ghost node cards at plausible canvas positions */}
      <Skeleton className="absolute left-16 top-12 h-14 w-40 rounded-lg" />
      <Skeleton className="absolute left-64 top-32 h-16 w-52 rounded-lg" />
      <Skeleton className="absolute left-48 top-56 h-12 w-36 rounded-lg" />
      <Skeleton className="absolute left-[420px] top-16 h-14 w-44 rounded-lg" />
      <Skeleton className="absolute left-[500px] top-52 h-16 w-40 rounded-lg" />
    </div>
  );
}
