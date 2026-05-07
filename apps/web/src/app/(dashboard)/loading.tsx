import { Skeleton } from '@memory-palace/ui';

export default function DashboardLoading() {
  return (
    <div className="space-y-10 py-2">
      {/* WelcomeBanner skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72 md:h-9" />
        <Skeleton className="h-4 w-44" />
      </div>

      {/* StatsBar skeleton — 3-col grid mirrors the real component */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border bg-card px-5 py-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* RecentPalaces skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5 rounded-lg border bg-card px-5 py-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-1/3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
