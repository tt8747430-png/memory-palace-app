import { Suspense } from 'react';
import { WelcomeBanner, StatsBar, RecentPalaces } from '@/features/dashboard';
import { DailyReviewCta, StreakCounter } from '@/features/practice';
import { Skeleton } from '@memory-palace/ui';
import { StatisticsPanelSection } from './_components/StatisticsPanelSection';

export const metadata = {
  title: 'Home',
  description: 'Your Memory Palace dashboard — stats, recent palaces, and quick actions.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Suspense fallback={<Skeleton className="h-12 w-64" />}>
          <WelcomeBanner />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-7 w-24 rounded-full" />}>
          <StreakCounter />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-24 rounded-lg" />}>
        <DailyReviewCta />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-lg" />
            ))}
          </div>
        }
      >
        <StatsBar />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        }
      >
        <RecentPalaces />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <StatisticsPanelSection />
      </Suspense>
    </div>
  );
}
