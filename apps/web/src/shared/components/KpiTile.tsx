import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@memory-palace/ui';

export type KpiTileTone = 'neutral' | 'success' | 'warning' | 'primary';

export interface KpiTileDelta {
  value: number;

  direction?: 'up' | 'down' | 'flat';

  unit?: string;

  invertTone?: boolean;
}

interface KpiTileProps {
  label: ReactNode;

  value: ReactNode;

  caption?: ReactNode;

  spark?: ReactNode;

  icon?: ReactNode;

  delta?: KpiTileDelta;

  href?: string;

  tone?: KpiTileTone;

  className?: string;
}

const TONE_RING: Record<KpiTileTone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  primary: 'text-primary',
};

export function KpiTile({
  label,
  value,
  caption,
  spark,
  icon,
  delta,
  href,
  tone = 'neutral',
  className,
}: KpiTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {icon ? <span className={cn('shrink-0', TONE_RING[tone])}>{icon}</span> : null}
          {label}
        </span>
        {href ? (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
        ) : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
          {caption ? <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p> : null}
        </div>
        {spark ? <div className={cn('shrink-0', TONE_RING[tone])}>{spark}</div> : null}
      </div>

      {delta ? (
        <div className="mt-3">
          <DeltaChip {...delta} />
        </div>
      ) : null}
    </>
  );

  const shell = cn(
    'group flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all sm:p-5',
    href &&
      'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:hover:translate-y-0',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }

  return <section className={shell}>{body}</section>;
}

export function DeltaChip({ value, direction, unit = '%', invertTone }: KpiTileDelta) {
  const dir: 'up' | 'down' | 'flat' = direction ?? (value > 0 ? 'up' : value < 0 ? 'down' : 'flat');
  const positive = invertTone ? dir === 'down' : dir === 'up';
  const negative = invertTone ? dir === 'up' : dir === 'down';

  const tone =
    dir === 'flat'
      ? 'bg-muted text-muted-foreground'
      : positive
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : negative
          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
          : 'bg-muted text-muted-foreground';

  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  const display = `${value > 0 ? '+' : ''}${value}${unit}`;
  const labelText =
    dir === 'flat'
      ? `No change (${display})`
      : `${positive ? 'Up' : 'Down'} ${Math.abs(value)}${unit}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        tone,
      )}
      aria-label={labelText}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {display}
    </span>
  );
}
