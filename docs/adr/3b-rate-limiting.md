# ADR 3B-001: Rate Limiting Strategy

**Status:** Implemented in Phase 3C

## Context

Server Actions in Phase 3B expose create/update/delete mutations for palace CRUD. Without rate limiting, authenticated users could hammer the DB with mass inserts or deletes. A rate-limiting mechanism is needed before these actions reach production load.

## Options considered

### 1. In-process sliding window (Map + timestamps)

Simple, no dependencies. Broken in serverless: each function instance has independent memory, so rate state is not shared across cold starts or concurrent instances. **Rejected.**

### 2. Supabase DB table

An `api_rate_limits(user_id, bucket, count, reset_at)` table with Postgres upsert. Works in all environments, no extra service. But adds a DB round-trip to every action — ~5–20 ms penalty per request. **Rejected.**

### 3. Upstash Redis (`@upstash/ratelimit`)

Serverless-native Redis. Atomic sliding window via Lua script. P99 latency ~2–5 ms. No connection pool to manage. Free tier covers development volume. `@upstash/ratelimit` provides a clean `limit(identifier)` API with a typed response. **Selected.**

## Decision

**Use Upstash Redis with sliding windows, implemented in Phase 3C.**

## Implementation

Rate limiting lives in `apps/web/src/shared/lib/ratelimit.ts`. Two buckets:

- `write` — 30 requests / 10 s — palace CRUD mutations
- `search` — 60 requests / 10 s — FTS node queries

The limiter is a lazy singleton (avoids creating the Redis connection at import time, important for serverless cold starts). When `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are absent, `checkRateLimit` returns `{ success: true }` — safe for local dev.

All mutating server actions (`createPalace`, `updatePalace`, `deletePalace`) and `searchNodes` call `checkRateLimit(user.id, bucket)` immediately after the auth check, returning `TOO_MANY_REQUESTS` if the limit is exceeded.

Required env vars (set in Vercel for production): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
