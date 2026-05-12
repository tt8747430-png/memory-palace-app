import { getPracticeStats, StatisticsPanel } from '@/features/practice';

export async function StatisticsPanelSection() {
  const result = await getPracticeStats({});
  if (!result.success) return null;
  if (result.data.totalPracticed === 0) return null;
  return <StatisticsPanel stats={result.data} />;
}
