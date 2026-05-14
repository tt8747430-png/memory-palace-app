import { ImageResponse } from 'next/og';
import { BrandIcon } from './_brand-icon';

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

const bg = 'radial-gradient(ellipse at 42% 38%, #1e1b4b 0%, #0f172a 52%, #160b33 100%)';

export default function Icon({ id }: { id: string }) {
  const { width, height } = iconSizes[id as IconId] ?? iconSizes.md;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
      }}
    >
      <BrandIcon size={width} />
    </div>,
    { width, height },
  );
}
