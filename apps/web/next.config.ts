import type { NextConfig } from 'next';

// Headers that are correct and meaningful as static values. CSP is intentionally
// omitted here — a per-request nonce-based CSP is generated in src/proxy.ts and
// attached to every response there. A static CSP in next.config cannot carry a
// nonce, and a permissive fallback would be security theatre.
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
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // CORS for API routes — restrict to the canonical site origin.
        // No wildcard '*' in production. Pre-flight OPTIONS is handled inline
        // in each route handler.
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
