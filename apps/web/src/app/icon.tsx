import { ImageResponse } from 'next/og';

export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 32, height: 32 }, id: 'sm' },
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: 'md' },
    { contentType: 'image/png', size: { width: 512, height: 512 }, id: 'lg' },
  ];
}

export default function Icon({ size }: { id: string; size: { width: number; height: number } }) {
  const svgSize = Math.round(size.width * 0.75);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #160b33 100%)',
      }}
    >
      {/*
       * "M" shaped node-network:
       *   (3,4) ---- (12,11) ---- (21,4)
       *    |                         |
       *  (3,20)                  (21,20)
       *
       * Five nodes: bottom-left, top-left, center hub, top-right, bottom-right.
       * Four edges forming the letter M.
       */}
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Edges */}
        <line
          x1="3"
          y1="20"
          x2="3"
          y2="4"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <line
          x1="3"
          y1="4"
          x2="12"
          y2="11"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <line
          x1="12"
          y1="11"
          x2="21"
          y2="4"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <line
          x1="21"
          y1="4"
          x2="21"
          y2="20"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />

        {/* Bottom anchor nodes */}
        <circle cx="3" cy="20" r="2.2" fill="#3b82f6" />
        <circle cx="21" cy="20" r="2.2" fill="#3b82f6" />

        {/* Top corner nodes */}
        <circle cx="3" cy="4" r="2.2" fill="#8b5cf6" />
        <circle cx="21" cy="4" r="2.2" fill="#8b5cf6" />

        {/* Center hub — three concentric circles for a glowing effect */}
        <circle cx="12" cy="11" r="3.8" fill="#312e81" />
        <circle cx="12" cy="11" r="2.6" fill="#6366f1" />
        <circle cx="12" cy="11" r="1.3" fill="#c7d2fe" />
      </svg>
    </div>,
    { width: size.width, height: size.height },
  );
}
