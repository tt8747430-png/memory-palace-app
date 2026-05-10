/**
 * Cinematic background.
 *
 * Two modes:
 *   - **default** — deep-navy base + slow aurora sweep + drifting nebula
 *     blobs + static starfield + radial vignette. Used by surfaces with no
 *     looping video (auth shell, about, join).
 *   - **videoOnly** — fullscreen looping `<video>` over the navy base, no
 *     CSS layers. Per the cinematic spec the video provides all visual
 *     depth, so no orbs/aurora/vignette layers are stacked on top.
 *
 * Both modes render `pointer-events: none` and `aria-hidden`.
 */
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
        </>
      )}
    </div>
  );
}
