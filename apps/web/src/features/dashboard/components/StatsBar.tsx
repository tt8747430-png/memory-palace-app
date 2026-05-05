import { Building2, DoorOpen, BrainCircuit } from 'lucide-react';
import { getDashboardStats } from '../actions/getDashboardStats';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export async function StatsBar() {
  const result = await getDashboardStats();
  const stats = result.success ? result.data : { palaceCount: 0, roomCount: 0, nodeCount: 0 };

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <StatItem
        icon={<Building2 className="h-5 w-5" />}
        label="Palaces"
        value={stats.palaceCount}
      />
      <StatItem icon={<DoorOpen className="h-5 w-5" />} label="Rooms" value={stats.roomCount} />
      <StatItem icon={<BrainCircuit className="h-5 w-5" />} label="Nodes" value={stats.nodeCount} />
    </div>
  );
}
