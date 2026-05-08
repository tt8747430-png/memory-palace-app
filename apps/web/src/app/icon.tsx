import { ImageResponse } from 'next/og';
import { BrandIcon } from './_brand-icon';

// Next.js only guarantees `id` is forwarded as a prop from generateImageMetadata;
// `size` is used for HTTP headers / <link> attributes but is not reliably passed
// to the component. Keep a module-level map and look up by id instead.
const iconSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 192, height: 192 },
  lg: { width: 512, height: 512 },
} as const;

type IconId = keyof typeof iconSizes;

export function generateImageMetadata() {
  return (Object.keys(iconSizes) as IconId[]).map((id) => ({
    contentType: 'image/png' as const,
    size: iconSizes[id],
    id,
  }));
}

export default function Icon({ id }: { id: string }) {
  const size = iconSizes[id as IconId] ?? iconSizes.md;
  const s = Math.round(size.width * 0.84);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 42% 38%, #1e1b4b 0%, #0f172a 52%, #160b33 100%)',
      }}
    >
      <BrandIcon size={s} />
    </div>,
    { width: size.width, height: size.height },
  );
}
