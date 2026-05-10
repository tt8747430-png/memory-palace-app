/**
 * Shared motion constants for marketing surfaces.
 *
 * Adopting a single ease curve across all reveal/transition animations
 * eliminates the per-component drift that crept in across CinematicHero,
 * Capabilities, Features, BlurText, and the onboarding wizard. Use this
 * as the default `ease` argument for any framer-motion or CSS transition
 * on a marketing surface.
 *
 * The cubic-bezier `[0.25, 0.1, 0.25, 1]` is the "smooth ease" curve
 * favoured by the cosmic-canvas and backgroundgallery references —
 * mirrors `ease-out` but with a softer tail-off than CSS `ease`.
 */
export const SMOOTH_EASE = [0.25, 0.1, 0.25, 1] as const;

/** CSS string form, for use in `transition-timing-function` declarations. */
export const SMOOTH_EASE_CSS = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
