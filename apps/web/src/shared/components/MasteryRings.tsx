import { cn } from '@memory-palace/ui';

export type MasteryRingsProps = {
  mastered: number;
  familiar: number;
  learning: number;
  fresh: number;
  /** Optional total override; defaults to sum. */
  total?: number;
  size?: number;
  className?: string;
  label?: string;
};

const STROKE = 8;
const GAP = 2;

type Ring = {
  key: 'mastered' | 'familiar' | 'learning' | 'fresh';
  label: string;
  /** Tailwind text color class. */
  toneClass: string;
  value: number;
};

/**
 * Concentric SVG rings showing mastery distribution.
 *
 * Each ring's arc length is proportional to its share of total reviewed nodes.
 * Pure SVG, no chart library. Uses `currentColor` per ring via Tailwind tint
 * classes so dark/light/high-contrast themes work automatically.
 */
export function MasteryRings({
  mastered,
  familiar,
  learning,
  fresh,
  total,
  size = 168,
  className,
  label,
}: MasteryRingsProps) {
  const sum = total ?? mastered + familiar + learning + fresh;
  const safeTotal = Math.max(sum, 1);

  const rings: Ring[] = [
    { key: 'mastered', label: 'Mastered', toneClass: 'text-emerald-500', value: mastered },
    { key: 'familiar', label: 'Familiar', toneClass: 'text-sky-500', value: familiar },
    { key: 'learning', label: 'Learning', toneClass: 'text-amber-500', value: learning },
    { key: 'fresh', label: 'New', toneClass: 'text-rose-500', value: fresh },
  ];

  return (
    <div className={cn('flex items-center gap-5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={label ?? `Mastery breakdown across ${sum} nodes`}
        className="shrink-0"
      >
        {rings.map((ring, index) => {
          const radius = 46 - index * (STROKE + GAP);
          if (radius < STROKE) return null;
          const circumference = 2 * Math.PI * radius;
          const fraction = sum === 0 ? 0 : ring.value / safeTotal;
          const dash = circumference * fraction;
          return (
            <g key={ring.key} transform="rotate(-90 50 50)" className={ring.toneClass}>
              <circle
                cx={50}
                cy={50}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeOpacity={0.12}
              />
              <circle
                cx={50}
                cy={50}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </g>
          );
        })}
        <text
          x={50}
          y={50}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
          fill="currentColor"
        >
          {sum}
        </text>
      </svg>

      <ul className="space-y-1.5 text-sm">
        {rings.map((ring) => (
          <li key={ring.key} className="flex items-center gap-2">
            <span
              className={cn('h-2.5 w-2.5 rounded-full bg-current', ring.toneClass)}
              aria-hidden
            />
            <span className="text-muted-foreground">{ring.label}</span>
            <span className="font-medium tabular-nums text-foreground">{ring.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
