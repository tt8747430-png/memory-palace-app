import { ImageResponse } from 'next/og';
import { BrandIcon } from './_brand-icon';

export const size = { width: 180, height: 180 };

const bg = 'radial-gradient(ellipse at 42% 38%, #1e1b4b 0%, #0f172a 52%, #160b33 100%)';

export default function AppleIcon() {
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
      <BrandIcon size={size.width} />
    </div>,
    size,
  );
}
