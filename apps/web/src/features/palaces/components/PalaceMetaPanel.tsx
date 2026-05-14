import { Clock, DoorOpen, BrainCircuit, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import type { PalaceMeta } from '../actions/getPalaceMeta';

interface Props {
  meta: PalaceMeta;
  createdAt: Date;
  updatedAt: Date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function PalaceMetaPanel({ meta, createdAt, updatedAt }: Props) {
  const masteryPct =
    meta.nodeCount > 0 ? Math.round((meta.masteredCount / meta.nodeCount) * 100) : 0;

  const rows: Array<{ icon: typeof DoorOpen; label: string; value: string; title?: string }> = [
    {
      icon: DoorOpen,
      label: 'Rooms',
      value: String(meta.roomCount),
    },
    {
      icon: BrainCircuit,
      label: 'Nodes',
      value: String(meta.nodeCount),
    },
    {
      icon: Sparkles,
      label: 'Mastered',
      value: meta.nodeCount > 0 ? `${meta.masteredCount} (${masteryPct}%)` : '—',
    },
    {
      icon: Clock,
      label: 'Last practiced',
      value: meta.lastPracticedAt ? formatRelative(meta.lastPracticedAt) : 'Never',
      title: meta.lastPracticedAt ? meta.lastPracticedAt.toLocaleString() : undefined,
    },
    {
      icon: Calendar,
      label: 'Created',
      value: formatDate(createdAt),
      title: createdAt.toLocaleString(),
    },
    {
      icon: Calendar,
      label: 'Updated',
      value: formatRelative(updatedAt),
      title: updatedAt.toLocaleString(),
    },
  ];

  return (
    <section className="rounded-2xl border bg-card shadow-sm" aria-labelledby="palace-meta-heading">
      <header className="border-b px-5 py-3">
        <h2 id="palace-meta-heading" className="text-sm font-semibold tracking-tight">
          Details
        </h2>
      </header>
      <dl className="divide-y">
        {rows.map(({ icon: Icon, label, value, title }) => (
          <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className={cn('text-sm font-medium tabular-nums')} title={title}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
