import { type Duration, Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';

type Bucket = 'write' | 'search';

const BUCKETS: Record<Bucket, { limit: number; window: Duration }> = {
  write: { limit: 30, window: '10 s' },
  search: { limit: 60, window: '10 s' },
};

const globalForRatelimit = globalThis as unknown as {
  __mpRedis?: Redis;
  __mpLimiters?: Map<Bucket, Ratelimit>;
};

function getRedis(): Redis | null {
  if (globalForRatelimit.__mpRedis) return globalForRatelimit.__mpRedis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'Rate limiting is unconfigured in production. ' +
          'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
      );
    }
    return null;
  }
  globalForRatelimit.__mpRedis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return globalForRatelimit.__mpRedis;
}

function getLimiter(bucket: Bucket): Ratelimit | null {
  const limiters = (globalForRatelimit.__mpLimiters ??= new Map());
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

export async function checkRateLimit(
  userId: string,
  bucket: Bucket,
): Promise<{ success: boolean }> {
  const limiter = getLimiter(bucket);
  if (!limiter) return { success: true };

  const { success } = await limiter.limit(`${bucket}:${userId}`);
  return { success };
}
