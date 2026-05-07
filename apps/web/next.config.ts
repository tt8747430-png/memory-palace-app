import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Headers that are correct and meaningful as static values. CSP is intentionally
// omitted: a real CSP for App Router needs per-request nonces (added in the
// Phase 8 hardening pass). Sending a permissive `'unsafe-inline' 'unsafe-eval'`
// CSP would be security theatre — preferable to send no CSP than a misleading
// one.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@memory-palace/db', '@memory-palace/ui'],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress verbose Sentry CLI output in CI.
  silent: true,
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (CI/CD only).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Disable automatic instrumentation of server components/routes — we
  // control tracing manually to avoid unexpected overhead.
  autoInstrumentServerFunctions: false,
  // Disable the Sentry tunnel route to keep the Next.js route surface minimal.
  tunnelRoute: undefined,
});
