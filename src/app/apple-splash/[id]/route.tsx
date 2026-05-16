import { ImageResponse } from 'next/og';
import { BrandIcon } from '../../_brand-icon';
import { SPLASH_SIZES } from '../../_splash-sizes';

const BG = 'radial-gradient(ellipse at 50% 38%, #1e1b4b 0%, #0f172a 60%, #160b33 100%)';

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return SPLASH_SIZES.map(({ id }) => ({ id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const entry = SPLASH_SIZES.find((s) => s.id === id);
  if (!entry) return new Response('Not Found', { status: 404 });

  const iconSize = Math.round(Math.min(entry.width, entry.height) * 0.32);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BG,
      }}
    >
      <BrandIcon size={iconSize} />
    </div>,
    {
      width: entry.width,
      height: entry.height,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
}
