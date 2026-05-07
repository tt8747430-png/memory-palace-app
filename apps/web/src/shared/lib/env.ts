import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Public site URL for absolute redirects (e.g. Supabase email confirmations).
  // When unset, server actions fall back to the request's forwarded host.
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  // When absent, rate limiting is a no-op locally; production presence is
  // enforced at first use, see shared/lib/ratelimit.ts.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Vercel system variable — only available in deployed environments.
  VERCEL_URL: z.string().min(1).optional(),
  // Sentry — server-only DSN (never shipped to the browser).
  // When absent (local dev without .env.local), Sentry init is a no-op.
  SENTRY_DSN: z.string().url().optional(),
  // Public Sentry DSN — safe to expose; used by the browser SDK.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
