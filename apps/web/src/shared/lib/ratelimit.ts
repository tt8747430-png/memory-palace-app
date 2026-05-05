import { type Duration, Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';

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

// One Redis connection shared across all buckets — creating a new client per
// bucket wastes TCP connections and Upstash request quota on each cold start.
let redisInstance: Redis | null = null;
const limiters = new Map<Bucket, Ratelimit>();

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'Rate limiting is unconfigured in production. ' +
          'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
      );
    }
    return null;
  }
  redisInstance = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redisInstance;
}

function getLimiter(bucket: Bucket): Ratelimit | null {
  const existing = limiters.get(bucket);
  if (existing) return existing;

  const redis = getRedis();
  if (!redis) return null;

  const { limit, window } = BUCKETS[bucket];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `@memory-palace/${bucket}`,
  });
  limiters.set(bucket, limiter);
  return limiter;
}

/**
 * Check rate limit for a user + bucket.
 * Returns `{ success: true }` as a no-op when Upstash is not configured —
 * this branch is unreachable in production (see getRedis).
 */
export async function checkRateLimit(
  userId: string,
  bucket: Bucket,
): Promise<{ success: boolean }> {
  const limiter = getLimiter(bucket);
  if (!limiter) return { success: true };

  const { success } = await limiter.limit(`${bucket}:${userId}`);
  return { success };
}
