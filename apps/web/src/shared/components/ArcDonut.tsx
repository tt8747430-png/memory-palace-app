import { cn } from '@memory-palace/ui';

export type ArcDonutProps = {
  value: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  caption?: string;
  className?: string;

  toneClass?: string;
};

export function ArcDonut({
  value,
  total,
  size = 168,
  strokeWidth = 10,
  label,
  caption,
  className,
  toneClass = 'text-primary',
}: ArcDonutProps) {
  const fraction = total <= 0 ? 0 : Math.min(value / total, 1);

  const radius = 42;
  const arcLength = 2 * Math.PI * radius * (240 / 360);
  const dashFilled = arcLength * fraction;

  const startAngle = -210;
  const endAngle = 30;
  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [50 + radius * Math.cos(rad), 50 + radius * Math.sin(rad)] as const;
  };
  const [sx, sy] = polar(startAngle);
  const [ex, ey] = polar(endAngle);

  const pathD = `M ${sx} ${sy} A ${radius} ${radius} 0 1 1 ${ex} ${ey}`;

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={label ?? `${value} of ${total}`}
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/40"
          strokeOpacity={0.4}
        />
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashFilled} ${arcLength}`}
          className={toneClass}
        />
        <text
          x={50}
          y={48}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
          fontWeight={700}
          fill="currentColor"
          className="text-foreground"
        >
          {value}
        </text>
        <text
          x={50}
          y={62}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={8}
          fill="currentColor"
          className="text-muted-foreground"
        >
          of {total}
        </text>
      </svg>
      {caption ? <p className="-mt-2 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
