import { Suspense } from 'react';
import { Skeleton } from '@memory-palace/ui';
import { DashboardBento } from './_components/DashboardBento';
import { StatisticsPanelSection } from './_components/StatisticsPanelSection';

export const metadata = {
  title: 'Home',
  description: 'Your Memory Palace dashboard — stats, recent palaces, and quick actions.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
            <Skeleton className="col-span-2 h-56 rounded-2xl sm:col-span-4 sm:row-span-2 sm:h-full" />
            <Skeleton className="col-span-1 h-28 rounded-2xl sm:col-span-2" />
            <Skeleton className="col-span-1 h-28 rounded-2xl sm:col-span-2" />
            <Skeleton className="col-span-1 h-24 rounded-2xl sm:col-span-2" />
            <Skeleton className="col-span-1 h-24 rounded-2xl sm:col-span-2" />
            <Skeleton className="col-span-2 h-24 rounded-2xl sm:col-span-2" />
            <Skeleton className="col-span-2 h-40 rounded-2xl sm:col-span-6" />
          </div>
        }
      >
        <DashboardBento />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <StatisticsPanelSection />
      </Suspense>
    </div>
  );
}
