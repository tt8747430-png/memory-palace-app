/**
 * Synaptic Palace — shared brand SVG.
 *
 * Rendered by @vercel/og / Satori inside ImageResponse, so:
 *   - all SVG props must be camelCase (strokeWidth, not stroke-width)
 *   - no imports other than types
 *   - no hooks
 */

interface BrandIconProps {
  size: number;
}

export function BrandIcon({ size }: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* ── Side column lines ── */}
      <line
        x1="4"
        y1="5"
        x2="4.5"
        y2="19"
        stroke="#818cf8"
        strokeWidth="0.6"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="5"
        x2="19.5"
        y2="19"
        stroke="#818cf8"
        strokeWidth="0.6"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />

      {/* ── Top-arch edge lines (palace crown) ── */}
      <line
        x1="4"
        y1="5"
        x2="8.5"
        y2="2.5"
        stroke="#a78bfa"
        strokeWidth="0.75"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
      <line
        x1="8.5"
        y1="2.5"
        x2="12"
        y2="1.8"
        stroke="#a78bfa"
        strokeWidth="0.75"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="1.8"
        x2="15.5"
        y2="2.5"
        stroke="#a78bfa"
        strokeWidth="0.75"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
      <line
        x1="15.5"
        y1="2.5"
        x2="20"
        y2="5"
        stroke="#a78bfa"
        strokeWidth="0.75"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />

      {/* ── Spoke lines: every node → central hub ── */}
      <line
        x1="4"
        y1="5"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <line
        x1="8.5"
        y1="2.5"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="1.8"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <line
        x1="15.5"
        y1="2.5"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="5"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="19"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <line
        x1="19.5"
        y1="19"
        x2="12"
        y2="12"
        stroke="#818cf8"
        strokeWidth="0.65"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />

      {/* ── Arch nodes (palace crown) ── */}
      <circle cx="4" cy="5" r="1.45" fill="#7c3aed" />
      <circle cx="8.5" cy="2.5" r="1.15" fill="#a78bfa" />
      <circle cx="12" cy="1.8" r="1.55" fill="#8b5cf6" />
      <circle cx="15.5" cy="2.5" r="1.15" fill="#a78bfa" />
      <circle cx="20" cy="5" r="1.45" fill="#7c3aed" />

      {/* ── Base anchor nodes ── */}
      <circle cx="4.5" cy="19" r="1.55" fill="#2563eb" />
      <circle cx="19.5" cy="19" r="1.55" fill="#2563eb" />

      {/* ── Central hub: 4-ring glow ── */}
      <circle cx="12" cy="12" r="4.4" fill="#312e81" fillOpacity="0.45" />
      <circle cx="12" cy="12" r="3.1" fill="#312e81" />
      <circle cx="12" cy="12" r="2.1" fill="#4338ca" />
      <circle cx="12" cy="12" r="1.2" fill="#818cf8" />
      <circle cx="12" cy="12" r="0.55" fill="#e0e7ff" />
    </svg>
  );
}
