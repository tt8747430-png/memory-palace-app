import { Skeleton } from '@/ui';

export default function PalaceLoading() {
  return (
    <div className="space-y-8 py-2">
      {}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3.5 w-3.5 rounded-sm" />
        <Skeleton className="h-4 w-28" />
      </div>

      {}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 shrink-0 rounded-md" />
      </div>

      {}
      <section className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border bg-card px-5 py-5">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="mt-2 h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
