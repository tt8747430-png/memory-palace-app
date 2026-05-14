import type { RecentPalace } from '../actions/getRecentPalaces';
import type { ActivityEvent } from '../activity';
import { DashboardHeader } from './DashboardHeader';
import { DashboardKpiRow } from './DashboardKpiRow';
import { RecentPalacesPanel } from './RecentPalacesPanel';
import { ActivityFeedPanel } from './ActivityFeedPanel';
import { DuePracticeAside, type DuePracticeItem } from './DuePracticeAside';
import { StreakGoalAside } from './StreakGoalAside';
import { QuickLaunchAside } from './QuickLaunchAside';

interface Props {
  displayName: string;
  stats: {
    palaceCount: number;
    roomCount: number;
    nodeCount: number;
  };
  recentPalaces: RecentPalace[];
  dueNodes: DuePracticeItem[];
  events: ActivityEvent[];
  topStreak: number;
  weeklyActivity: number[];
  mastery: { mastered: number; total: number };
}

export function DashboardOverview({
  displayName,
  stats,
  recentPalaces,
  dueNodes,
  events,
  topStreak,
  weeklyActivity,
  mastery,
}: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHeader displayName={displayName} dueCount={dueNodes.length} />

      <DashboardKpiRow
        palaceCount={stats.palaceCount}
        roomCount={stats.roomCount}
        nodeCount={stats.nodeCount}
        masteredCount={mastery.mastered}
        totalNodes={mastery.total}
        topStreak={topStreak}
        weeklyActivity={weeklyActivity}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentPalacesPanel palaces={recentPalaces} />
          <ActivityFeedPanel events={events} title="Recent activity" />
        </div>
        <aside className="space-y-6">
          <DuePracticeAside dueNodes={dueNodes} />
          <StreakGoalAside weeklyActivity={weeklyActivity} topStreak={topStreak} />
          <QuickLaunchAside />
        </aside>
      </div>
    </div>
  );
}
