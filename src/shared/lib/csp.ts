export function buildCsp(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const lines = [
    `default-src 'self'`,
    [
      `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,

      `https://us-assets.i.posthog.com https://eu-assets.i.posthog.com`,
    ].join(' '),
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    [
      `connect-src 'self'`,

      `https://*.supabase.co wss://*.supabase.co`,

      `https://us.i.posthog.com https://eu.i.posthog.com https://us.posthog.com https://app.posthog.com`,
      `https://us-assets.i.posthog.com https://eu-assets.i.posthog.com`,
    ].join(' '),
    `worker-src 'self' blob:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  return lines.join('; ');
}
