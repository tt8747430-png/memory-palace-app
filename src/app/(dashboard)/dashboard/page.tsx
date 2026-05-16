import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/ui';
import { DashboardOverview, getDashboardStats, getRecentPalaces } from '@/features/dashboard';
import { getDueNodes, getPracticeStats } from '@/features/practice';
import { getUserProfile } from '@/shared/lib/userProfile';

export const metadata: Metadata = {
  description: 'Your Memory Palace dashboard — stats, recent palaces, and quick actions.',
};

const DUE_LIMIT = 5;

async function DashboardData() {
  const [profileResult, statsResult, recentResult, dueResult, practiceResult] = await Promise.all([
    getUserProfile(),
    getDashboardStats(),
    getRecentPalaces(),
    getDueNodes({ limit: DUE_LIMIT }),
    getPracticeStats(),
  ]);

  const displayName =
    profileResult.success && profileResult.data.displayName.trim()
      ? profileResult.data.displayName.trim()
      : 'there';

  const stats = statsResult.success
    ? statsResult.data
    : { palaceCount: 0, roomCount: 0, nodeCount: 0 };
  const recentPalaces = recentResult.success ? recentResult.data : [];
  const dueCount = dueResult.success ? dueResult.data.length : 0;
  const practice = practiceResult.success ? practiceResult.data : null;

  return (
    <DashboardOverview
      displayName={displayName}
      stats={stats}
      recentPalaces={recentPalaces}
      dueCount={dueCount}
      topStreak={practice?.topStreak ?? 0}
      mastery={{
        mastered: practice?.mastery.mastered ?? 0,
        total: practice?.mastery.total ?? 0,
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
