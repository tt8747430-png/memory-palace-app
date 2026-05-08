import { getPracticeStats, StatisticsPanel } from '@/features/practice';

/**
 * Server-side wrapper around `StatisticsPanel`. The panel itself is a client
 * component (interactive tabs); this RSC fetches the stats once and forwards
 * them so the dashboard route doesn't need to import the client component
 * directly. Returns null when the user has no practice activity yet, so the
 * dashboard stays uncluttered for new accounts.
 */
export async function StatisticsPanelSection() {
  const result = await getPracticeStats({});
  if (!result.success) return null;
  if (result.data.totalPracticed === 0) return null;
  return <StatisticsPanel stats={result.data} />;
}
