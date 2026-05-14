import type { RecentPalace } from '@/features/dashboard';
import { DashboardHeader } from './DashboardHeader';
import { DashboardKpiRow } from './DashboardKpiRow';
import { RecentPalacesPanel } from './RecentPalacesPanel';

interface Props {
  displayName: string;
  stats: {
    palaceCount: number;
    roomCount: number;
    nodeCount: number;
  };
  recentPalaces: RecentPalace[];
  dueCount: number;
  topStreak: number;
  weeklyActivity: number[];
  mastery: { mastered: number; total: number };
}

export function DashboardOverview({
  displayName,
  stats,
  recentPalaces,
  dueCount,
  topStreak,
  weeklyActivity,
  mastery,
}: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHeader displayName={displayName} dueCount={dueCount} />

      <DashboardKpiRow
        palaceCount={stats.palaceCount}
        roomCount={stats.roomCount}
        nodeCount={stats.nodeCount}
        masteredCount={mastery.mastered}
        totalNodes={mastery.total}
        topStreak={topStreak}
        weeklyActivity={weeklyActivity}
      />

      <RecentPalacesPanel palaces={recentPalaces} />
    </div>
  );
}
