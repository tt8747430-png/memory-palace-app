import { cn } from '@memory-palace/ui';

interface SparklineProps {
  /** Raw numeric series — rendered oldest → newest, left → right. */
  values: number[];
  /** Width in px. SVG uses internal viewBox so this is just the rendered size. */
  width?: number;
  /** Height in px. */
  height?: number;
  /** Stroke width in user units (post viewBox). */
  strokeWidth?: number;
  /** Tailwind classes — `text-*` colors propagate via `currentColor`. */
  className?: string;
  /** Add a soft fill under the line. */
  fill?: boolean;
  /** Accessible label (defaults to a generic description). */
  label?: string;
}

/**
 * Tiny inline sparkline. Pure SVG, no chart library — every visual
 * property comes from `currentColor`, so `text-emerald-500` on the
 * parent recolours the entire line + fill.
 *
 * Renders an empty box when `values` is empty or all-equal so callers
 * can drop it in without conditional branching.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  className,
  fill = false,
  label,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <div
        aria-hidden="true"
        className={cn('inline-block opacity-30', className)}
        style={{ width, height }}
      />
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // viewBox = 100 wide × 24 tall — scale-invariant. 2 px padding so the
  // 1.5 px stroke isn't clipped at the top/bottom.
  const W = 100;
  const H = 24;
  const PAD = 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const fillPath = fill ? `${path} L${W},${H} L0,${H} Z` : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      className={cn('inline-block overflow-visible', className)}
    >
      {fillPath ? <path d={fillPath} fill="currentColor" fillOpacity={0.12} stroke="none" /> : null}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
