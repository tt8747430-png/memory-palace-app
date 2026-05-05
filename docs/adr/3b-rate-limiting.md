# ADR 3B-001: Rate Limiting Strategy

**Status:** Accepted — implementation deferred to Phase 3C

## Context

Server Actions in Phase 3B expose create/update/delete mutations for palace CRUD. Without rate limiting, authenticated users could hammer the DB with mass inserts or deletes. A rate-limiting mechanism is needed before these actions reach production load.

## Options considered

### 1. In-process sliding window (Map + timestamps)

Simple, no dependencies. Broken in serverless: each function instance has independent memory, so rate state is not shared across cold starts or concurrent instances. **Rejected.**

### 2. Supabase DB table

An `api_rate_limits(user_id, bucket, count, reset_at)` table with Postgres upsert. Works in all environments, no extra service. But adds a DB round-trip to every action — ~5–20 ms penalty per request. Acceptable for Phase 3C; too heavyweight for Phase 3B scope. **Deferred.**

### 3. Upstash Redis (`@upstash/ratelimit`)

Serverless-native Redis. Atomic sliding window via Lua script. P99 latency ~2–5 ms. No connection pool to manage. Free tier covers development volume. `@upstash/ratelimit` provides a clean `limit(identifier)` API with a typed response. **Selected — implement in Phase 3C.**

## Decision

**Use Upstash Redis for rate limiting, implemented in Phase 3C.**

Phase 3B server actions include a `// TODO(rate-limit): see docs/adr/3b-rate-limiting.md` comment at the callsite where `limit()` will be inserted. This keeps the action structure correct without blocking Phase 3B delivery.

## Implementation notes (Phase 3C)

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  // 30 writes per 10 seconds per user
  limiter: Ratelimit.slidingWindow(30, '10 s'),
  prefix: '@memory-palace/ratelimit',
});

// In each mutating server action, after the auth check:
const { success } = await ratelimit.limit(user.id);
if (!success) {
  return { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Slow down.' } };
}
```

Required env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — add to `env.ts` in Phase 3C.
