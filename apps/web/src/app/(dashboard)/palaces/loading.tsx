import { Skeleton } from '@memory-palace/ui';

export default function PalacesLoading() {
  return (
    <div className="space-y-8 py-2">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-56" />
        </div>
        {/* Action buttons placeholder */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Palace grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-card px-5 py-5">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
