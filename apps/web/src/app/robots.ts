import type { MetadataRoute } from 'next';
import { siteUrl } from '@/shared/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/join'],
        // Authenticated routes are private — no crawling
        disallow: ['/palaces', '/settings', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
