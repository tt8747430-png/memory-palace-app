import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Memory Palace',
    short_name: 'MemPalace',
    description:
      'Spatial learning through connected memory nodes. Build your palace, own your knowledge.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon?id=sm',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon?id=md',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon?id=lg',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
