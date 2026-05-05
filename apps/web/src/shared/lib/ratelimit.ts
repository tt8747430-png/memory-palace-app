import { type Duration, Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Bucket = 'write' | 'search';

/**
 * Rate limit buckets:
 * - write: 30 requests / 10 s  — create/update/delete mutations
 * - search: 60 requests / 10 s — FTS queries (expensive but read-only)
 */
const BUCKETS: Record<Bucket, { limit: number; window: Duration }> = {
  write: { limit: 30, window: '10 s' },
  search: { limit: 60, window: '10 s' },
};

const limiters = new Map<Bucket, Ratelimit>();

function isConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getLimiter(bucket: Bucket): Ratelimit {
  const existing = limiters.get(bucket);
  if (existing) return existing;

  const { limit, window } = BUCKETS[bucket];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `@memory-palace/${bucket}`,
  });
  limiters.set(bucket, limiter);
  return limiter;
}

/**
 * Check rate limit for a user + bucket.
 * Returns `{ success: true }` as a no-op when Upstash is not configured
 * (safe for local dev — set the env vars in production).
 */
export async function checkRateLimit(
  userId: string,
  bucket: Bucket,
): Promise<{ success: boolean }> {
  if (!isConfigured()) return { success: true };

  const { success } = await getLimiter(bucket).limit(`${bucket}:${userId}`);
  return { success };
}
