/**
 * Cinematic background.
 *
 * Two modes:
 *   - **default** — deep-navy base + canvas starfield + slow aurora sweep
 *     + drifting nebula blobs + static CSS stars + radial vignette. Used
 *     by surfaces with no looping video (auth shell, about, join).
 *   - **videoOnly** — fullscreen looping `<video>` over the navy base, no
 *     CSS layers. Per the cinematic spec the video provides all visual
 *     depth, so no orbs/aurora/vignette layers are stacked on top.
 *
 * Both modes render `pointer-events: none` and `aria-hidden`.
 */
import { Starfield } from './Starfield';

type CinematicBackgroundProps = {
  /** Optional fullscreen looping video URL. */
  videoSrc?: string;
  /** Optional poster image while the video buffers. */
  videoPoster?: string;
  /**
   * When true, render only the video (no aurora/nebula/stars/vignette).
   * Use for surfaces that should be a pure cinematic plate.
   */
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
          {/* Vignette: radial fade so chrome doesn't compete with the headline. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
            }}
          />
          {/*
           * OLED noise overlay — high-frequency SVG turbulence rendered at low
           * opacity with overlay blending. Breaks up flat dark regions on OLED
           * displays where banding is most visible, and adds tactile film grain
           * to the cinematic plate. Single base64 SVG keeps it network-free.
           */}
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
