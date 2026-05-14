import { Skeleton } from '@/ui';

export function CanvasLoadingSkeleton() {
  return (
    <div className="relative flex h-full w-full items-start justify-start overflow-hidden rounded-xl border bg-muted/10 p-8">
      {}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.15)_1px,transparent_1px)] bg-size-[20px_20px]"
      />

      {}
      <Skeleton className="absolute left-[8%] top-[8%] h-14 w-40 rounded-lg" />
      <Skeleton className="absolute left-[30%] top-[20%] h-16 w-52 rounded-lg" />
      <Skeleton className="absolute left-[15%] top-[45%] h-12 w-36 rounded-lg" />
      <Skeleton className="absolute left-[55%] top-[10%] hidden h-14 w-44 rounded-lg sm:block" />
      <Skeleton className="absolute left-[60%] top-[40%] hidden h-16 w-40 rounded-lg sm:block" />
    </div>
  );
}
