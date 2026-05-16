import { Building2, BrainCircuit, DoorOpen, Flame } from 'lucide-react';
import { KpiTile } from '@/shared/components/KpiTile';

interface DashboardKpiRowProps {
  palaceCount: number;
  roomCount: number;
  nodeCount: number;
  masteredCount: number;
  totalNodes: number;
  topStreak: number;
}

export function DashboardKpiRow({
  palaceCount,
  roomCount,
  nodeCount,
  masteredCount,
  totalNodes,
  topStreak,
}: DashboardKpiRowProps) {
  const masteryPct = totalNodes > 0 ? Math.round((masteredCount / totalNodes) * 100) : 0;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <KpiTile
        href="/palaces"
        label="Palaces"
        icon={<Building2 className="h-3.5 w-3.5" />}
        value={palaceCount}
      />
      <KpiTile
        href="/palaces"
        label="Rooms"
        icon={<DoorOpen className="h-3.5 w-3.5" />}
        value={roomCount}
      />
      <KpiTile
        href="/palaces"
        label="Nodes"
        icon={<BrainCircuit className="h-3.5 w-3.5" />}
        tone="primary"
        value={nodeCount}
        caption={totalNodes > 0 ? `${masteryPct}% mastered` : 'practice to start mastery'}
      />
      <KpiTile
        label="Streak"
        icon={<Flame className="h-3.5 w-3.5" />}
        tone={topStreak > 0 ? 'warning' : 'neutral'}
        value={<span className="tabular-nums">{topStreak}</span>}
        caption={topStreak > 0 ? 'top per-node streak' : 'practice to start a streak'}
      />
    </div>
  );
}
