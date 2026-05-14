import type { MetadataRoute } from 'next';
import { siteUrl } from '@/shared/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/login', '/signup'],

        disallow: ['/palaces', '/settings', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
