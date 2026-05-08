import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0f172a 0%, #160b33 60%, #0f172a 100%)',
        padding: '80px 90px',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Left — wordmark + tagline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          maxWidth: 640,
        }}
      >
        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-1px',
            lineHeight: 1.1,
          }}
        >
          Memory Palace
        </div>

        {/* Accent underline */}
        <div
          style={{
            width: 80,
            height: 4,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: 9999,
            marginTop: 18,
            marginBottom: 28,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#94a3b8',
            lineHeight: 1.5,
            maxWidth: 520,
          }}
        >
          Spatial learning through connected memory nodes. Build your palace, own your knowledge.
        </div>
      </div>

      {/* Right — large decorative M node-network */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="340"
          height="340"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft glow rings behind the center hub */}
          <circle cx="12" cy="11" r="7" fill="#312e81" fillOpacity="0.35" />
          <circle cx="12" cy="11" r="5" fill="#312e81" fillOpacity="0.35" />

          {/* Edges */}
          <path
            d="M3,20 L3,4"
            stroke="#6366f1"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M3,4 L12,11"
            stroke="#6366f1"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M12,11 L21,4"
            stroke="#6366f1"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M21,4 L21,20"
            stroke="#6366f1"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />

          {/* Bottom anchor nodes */}
          <circle cx="3" cy="20" r="2" fill="#3b82f6" />
          <circle cx="21" cy="20" r="2" fill="#3b82f6" />

          {/* Top corner nodes */}
          <circle cx="3" cy="4" r="2" fill="#8b5cf6" />
          <circle cx="21" cy="4" r="2" fill="#8b5cf6" />

          {/* Center hub */}
          <circle cx="12" cy="11" r="3.8" fill="#312e81" />
          <circle cx="12" cy="11" r="2.6" fill="#6366f1" />
          <circle cx="12" cy="11" r="1.3" fill="#c7d2fe" />
        </svg>
      </div>
    </div>,
    size,
  );
}
