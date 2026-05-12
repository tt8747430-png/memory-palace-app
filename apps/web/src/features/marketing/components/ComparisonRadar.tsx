import { cn } from '@memory-palace/ui';

const AXES = ['Spatial recall', 'Schedule', 'Walkability', 'Data ownership', 'Joy'] as const;

type RadarPoint = readonly [number, number, number, number, number];

const US: RadarPoint = [1.0, 0.9, 1.0, 0.95, 0.9];
const THEM: RadarPoint = [0.2, 0.55, 0.1, 0.4, 0.35];

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 120;
const RINGS = [0.25, 0.5, 0.75, 1];

function polar(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function polygon(values: RadarPoint): string {
  return values
    .map((v, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / values.length;
      const [x, y] = polar(angle, R * v);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function ringPath(ratio: number): string {
  return (
    AXES.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
      const [x, y] = polar(angle, R * ratio);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ') + ' Z'
  );
}

export function ComparisonRadar({ className }: { className?: string }) {
  return (
    <figure className={cn('mx-auto flex w-full max-w-md flex-col items-center gap-4', className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full text-emerald"
        role="img"
        aria-label="Memory Palace versus generic flashcards on five dimensions: spatial recall, scheduling, walkability, data ownership, and joy. Memory Palace scores near the outer ring on every axis; generic flashcards stay in the inner third."
      >
        {}
        {RINGS.map((r) => (
          <path
            key={r}
            d={ringPath(r)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {}
        {AXES.map((_, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
          const [x, y] = polar(angle, R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          );
        })}

        {}
        <g className="text-rose">
          <polygon
            points={polygon(THEM)}
            fill="currentColor"
            fillOpacity={0.12}
            stroke="currentColor"
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </g>

        {}
        <polygon
          points={polygon(US)}
          fill="currentColor"
          fillOpacity={0.22}
          stroke="currentColor"
          strokeOpacity={0.95}
          strokeWidth={1.75}
          strokeLinejoin="round"
        />

        {}
        {AXES.map((label, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
          const [x, y] = polar(angle, R + 22);

          const cos = Math.cos(angle);
          const anchor = cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle';
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-foreground"
              fontSize={11}
              fontWeight={500}
            >
              {label}
            </text>
          );
        })}
      </svg>

      <figcaption className="flex items-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald" aria-hidden />
          Memory Palace
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-rose/70" aria-hidden />
          Generic flashcards
        </span>
      </figcaption>
    </figure>
  );
}
