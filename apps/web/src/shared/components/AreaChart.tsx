'use client';

import { useId, useState } from 'react';
import { cn } from '@memory-palace/ui';

interface AreaChartProps {
  values: number[];

  labels?: readonly string[];

  width?: number;

  height?: number;

  strokeWidth?: number;

  label?: string;

  className?: string;

  valueUnit?: { singular: string; plural: string };
}

export function AreaChart({
  values,
  labels,
  width = 240,
  height = 64,
  strokeWidth = 1.75,
  label,
  className,
  valueUnit,
}: AreaChartProps) {
  const formatValue = (v: number) =>
    valueUnit ? `${v} ${v === 1 ? valueUnit.singular : valueUnit.plural}` : `${v}`;
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (values.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        aria-hidden
        className={cn('inline-block rounded-md bg-muted/40', className)}
      />
    );
  }

  const W = 100;
  const H = 32;
  const PAD_TOP = 3;
  const PAD_BOTTOM = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = PAD_TOP + (1 - (v - min) / range) * (H - PAD_TOP - PAD_BOTTOM);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`;

  const hoverPoint = hover !== null ? points[hover] : null;
  const hoverValue = hover !== null ? values[hover] : null;
  const hoverLabel = hover !== null && labels ? labels[hover] : undefined;

  const handlePointer = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (values.length - 1));
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    setHover(clamped);
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? 'Area chart'}
      className={cn('inline-block overflow-visible touch-none', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.32} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>

      <path d={fillPath} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {hoverPoint && hoverValue !== null ? (
        <g aria-hidden>
          <line
            x1={hoverPoint[0]}
            x2={hoverPoint[0]}
            y1={0}
            y2={H}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="1 1.5"
          />
          <circle
            cx={hoverPoint[0]}
            cy={hoverPoint[1]}
            r={1.6}
            fill="currentColor"
            stroke="var(--background, white)"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
          {}
          <TooltipPill
            x={hoverPoint[0]}
            y={hoverPoint[1]}
            text={
              hoverLabel ? `${hoverLabel} · ${formatValue(hoverValue)}` : formatValue(hoverValue)
            }
            W={W}
          />
        </g>
      ) : null}

      <rect
        x={0}
        y={0}
        width={W}
        height={H}
        fill="transparent"
        pointerEvents="all"
        onPointerMove={handlePointer}
        onPointerEnter={handlePointer}
        onPointerLeave={() => setHover(null)}
      />
    </svg>
  );
}

interface TooltipPillProps {
  x: number;
  y: number;
  text: string;
  W: number;
}

function TooltipPill({ x, y, text, W }: TooltipPillProps) {
  const charW = 1.6;
  const padX = 2;
  const padY = 1.2;
  const w = Math.max(10, text.length * charW + padX * 2);
  const h = 5;
  let cx = x - w / 2;
  cx = Math.max(0, Math.min(W - w, cx));
  const cy = Math.max(0, y - h - 2);
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <rect x={0} y={0} width={w} height={h} rx={h / 2} fill="currentColor" fillOpacity={0.92} />
      <text
        x={w / 2}
        y={h / 2 + padY}
        textAnchor="middle"
        fontSize={2.6}
        fontWeight={600}
        fill="var(--background, white)"
      >
        {text}
      </text>
    </g>
  );
}
