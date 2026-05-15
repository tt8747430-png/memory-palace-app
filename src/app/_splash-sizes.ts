export interface SplashSize {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly ratio: 2 | 3;
}

export const SPLASH_SIZES = [
  { id: 'iphone-15-pro-max-portrait', width: 1290, height: 2796, ratio: 3 },
  { id: 'iphone-15-pro-max-landscape', width: 2796, height: 1290, ratio: 3 },
  { id: 'iphone-15-pro-portrait', width: 1179, height: 2556, ratio: 3 },
  { id: 'iphone-15-pro-landscape', width: 2556, height: 1179, ratio: 3 },
  { id: 'iphone-14-portrait', width: 1170, height: 2532, ratio: 3 },
  { id: 'iphone-14-landscape', width: 2532, height: 1170, ratio: 3 },
  { id: 'iphone-se-portrait', width: 750, height: 1334, ratio: 2 },
  { id: 'iphone-se-landscape', width: 1334, height: 750, ratio: 2 },
] as const satisfies readonly SplashSize[];

export interface SplashLink {
  readonly href: string;
  readonly media: string;
}

export const SPLASH_LINKS: readonly SplashLink[] = SPLASH_SIZES.map((entry) => {
  const orientation = entry.width > entry.height ? 'landscape' : 'portrait';
  const cssShort = Math.min(entry.width, entry.height) / entry.ratio;
  const cssLong = Math.max(entry.width, entry.height) / entry.ratio;
  return {
    href: `/apple-splash/${entry.id}`,
    media: `screen and (device-width: ${cssShort}px) and (device-height: ${cssLong}px) and (-webkit-device-pixel-ratio: ${entry.ratio}) and (orientation: ${orientation})`,
  };
});
