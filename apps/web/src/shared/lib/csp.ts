export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

export function buildCsp(nonce: string): string {
  const lines = [
    `default-src 'self'`,
    // 'unsafe-inline' is ignored by browsers that support nonces; included for
    // older browser fallback. 'strict-dynamic' allows dynamically injected
    // scripts (Next.js chunks, PostHog recorder) loaded by nonce-trusted scripts.
    // 'unsafe-eval' is required by React dev mode for call-stack reconstruction;
    // never present in production builds.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
    // Next.js injects critical CSS inline; hashing every rule is impractical.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    [
      `connect-src 'self'`,
      // Supabase REST, Auth, Storage, and Realtime
      `https://*.supabase.co wss://*.supabase.co`,
      // PostHog analytics and session replay
      `https://us.i.posthog.com https://eu.i.posthog.com https://us.posthog.com https://app.posthog.com`,
    ].join(' '),
    `worker-src 'self' blob:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  return lines.join('; ');
}
