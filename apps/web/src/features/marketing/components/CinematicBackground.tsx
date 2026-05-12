import { Starfield } from './Starfield';

type CinematicBackgroundProps = {
  videoSrc?: string;

  videoPoster?: string;

  videoOnly?: boolean;
};

export function CinematicBackground({
  videoSrc,
  videoPoster,
  videoOnly,
}: CinematicBackgroundProps = {}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-cinematic" />
      {videoSrc ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={videoPoster}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
        />
      ) : null}
      {videoOnly ? null : (
        <>
          <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
          <div className="cinematic-aurora" />
          <div className="cinematic-nebula" />
          <div className="cinematic-stars" />
          {}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
            }}
          />
          {}
          <div
            className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              backgroundSize: '240px 240px',
            }}
          />
        </>
      )}
    </div>
  );
}
