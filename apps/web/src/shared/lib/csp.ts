/**
 * Content-Security-Policy builder.
 *
 * Note on `script-src`: we previously used `'strict-dynamic'` + per-request
 * nonces, but Next.js 16 with Turbopack production builds does not propagate
 * the nonce onto auto-generated chunk script tags, so every chunk got blocked
 * (visible in Lighthouse as `errors-in-console` + `inspector-issues`).
 *
 * Until Turbopack closes that gap, we rely on `'self' 'unsafe-inline'`:
 * external chunks load via the same-origin allowance, and Next.js's inline
 * bootstrap snippets are permitted via `'unsafe-inline'`. We retain the rest
 * of the policy (no inline-eval in prod, tight `connect-src`, no
 * `frame-ancestors`, etc.) so the security envelope is still meaningful.
 *
 * `generateNonce` is kept for forwards compatibility — the proxy may need to
 * re-introduce nonces once Next.js + Turbopack support `x-nonce` propagation.
 */

export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

export function buildCsp(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const lines = [
    `default-src 'self'`,
    [
      `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
      // PostHog loads its recorder + feature-flag config from the regional
      // `*-assets.i.posthog.com` CDN; ingestion goes to the non-assets host.
      `https://us-assets.i.posthog.com https://eu-assets.i.posthog.com`,
    ].join(' '),
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    [
      `connect-src 'self'`,
      // Supabase REST, Auth, Storage, and Realtime
      `https://*.supabase.co wss://*.supabase.co`,
      // PostHog analytics, session replay, and feature-flag config.
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
