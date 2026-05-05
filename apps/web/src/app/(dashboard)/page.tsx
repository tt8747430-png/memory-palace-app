import { Suspense } from 'react';
import { CardSkeleton } from '@/shared/components/CardSkeleton';
import { WelcomeBanner, StatsBar, RecentPalaces } from '@/features/dashboard';

export default function DashboardHomePage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<div className="h-14 animate-pulse rounded-md bg-muted" />}>
        <WelcomeBanner />
      </Suspense>

      <Suspense fallback={<CardSkeleton count={3} />}>
        <StatsBar />
      </Suspense>

      <Suspense fallback={<CardSkeleton count={2} />}>
        <RecentPalaces />
      </Suspense>
    </div>
  );
}
