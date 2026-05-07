# PostHog Migration Plan

**Status:** Pending Approval  
**Date:** 2026-05-07  
**Scope:** Sentry → PostHog telemetry migration.

---

## Audit Summary

### Sentry Surface Area (5 files)

| File                                                                      | Role                                                 | Disposition                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/sentry.client.config.ts`                                        | Browser SDK init, session replay, Long Task observer | Replace with PostHog init                                          |
| `apps/web/sentry.server.config.ts`                                        | Node.js SDK init                                     | Delete (no server-side PostHog global init needed)                 |
| `apps/web/sentry.edge.config.ts`                                          | Edge runtime SDK init                                | Delete                                                             |
| `apps/web/next.config.ts`                                                 | `withSentryConfig` wrapper                           | Unwrap; return plain `nextConfig`                                  |
| `apps/web/src/instrumentation.ts`                                         | Loads server/edge Sentry configs on cold start       | Update to be a no-op (or load PostHog Node on demand)              |
| `apps/web/src/features/spatial-canvas/components/CanvasErrorBoundary.tsx` | `Sentry.captureException`                            | Swap to `posthog.captureException`                                 |
| `apps/web/src/shared/lib/env.ts`                                          | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` vars          | Replace with `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| `apps/web/package.json`                                                   | `@sentry/nextjs` dependency                          | Remove; add `posthog-js`                                           |

---

## Part A — Sentry → PostHog Migration

### Strategy

PostHog's Next.js App Router integration requires a client `PHProvider` wrapper and manual pageview capture (because `capture_pageview: false` must be set to prevent double-firing with App Router's soft-navigation). No global server-side SDK init is needed; the `posthog-node` package is called per-request inside server actions if server-side events are required. For this codebase there are no explicit server-side custom events, so only `posthog-js` is required.

### Step-by-step

#### 1. Dependency swap (`apps/web/package.json`)

Remove `@sentry/nextjs`. Add `posthog-js`.

```jsonc
// Remove:
"@sentry/nextjs": "^10.52.0"

// Add:
"posthog-js": "^1.250.0"
```

#### 2. New: `apps/web/src/shared/lib/posthog-client.ts`

Lazy singleton that initialises `posthog-js` once (no-op when key is absent).

```ts
'use client';
// Thin wrapper so all call sites import from one place.
import posthog from 'posthog-js';
export { posthog };
```

#### 3. New: `apps/web/src/shared/components/PostHogProvider.tsx`

Client component that:

- Initialises the SDK in a `useEffect` (safe — runs only in the browser, never SSR).
- Wraps children with `PHProvider` from `posthog-js/react`.
- Mounts `PostHogPageView` in a `Suspense` boundary (required because it calls `useSearchParams`).

```tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = usePostHog();

  useEffect(() => {
    if (!pathname || !client) return;
    const url =
      window.origin + pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    client.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams, client]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    if (!key) return; // no-op in local dev without .env.local
    posthog.init(key, {
      api_host: host,
      ui_host: 'https://us.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // handled manually by PostHogPageView
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true, // protect PII (equivalent to Sentry maskAllText)
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
```

#### 4. Root layout — inject `PostHogProvider`

`apps/web/src/app/layout.tsx` — wrap the tree with `PostHogProvider` alongside `MotionProvider`. Place it _outside_ `MotionProvider` so it has no dependency on animation state.

```tsx
// Before:
<MotionProvider>{children}</MotionProvider>

// After:
<PostHogProvider>
  <MotionProvider>{children}</MotionProvider>
</PostHogProvider>
```

#### 5. `CanvasErrorBoundary.tsx` — replace `Sentry.captureException`

```tsx
// Remove:
import * as Sentry from '@sentry/nextjs';
// ...
Sentry.captureException(error, { extra: { componentStack: info.componentStack } });

// Add:
import posthog from 'posthog-js';
// ...
posthog.captureException(error, { extra: { componentStack: info.componentStack } });
```

`posthog.captureException` is a first-class method on `posthog-js` ≥ 1.130 that maps directly to Sentry's API surface. It no-ops when the SDK is not initialised.

#### 6. `env.ts` — swap env-var declarations

```ts
// Remove:
SENTRY_DSN: z.string().url().optional(),
NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
// And their parse entries.

// Add:
NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
// And their parse entries.
```

Note: `NEXT_PUBLIC_POSTHOG_KEY` is a browser-safe public key (not a secret).

#### 7. `instrumentation.ts` — remove Sentry imports

The `register()` hook currently imports server/edge Sentry configs. After deletion of those files, `register()` can become an empty export or be repurposed for future server-side PostHog Node init.

```ts
// After change — no-op; preserved for future server-side instrumentation.
export async function register() {
  // PostHog has no global server-side init; per-request posthog-node
  // instances are created lazily if server-side event capture is needed.
}
```

#### 8. Delete Sentry config files

- `apps/web/sentry.client.config.ts`
- `apps/web/sentry.server.config.ts`
- `apps/web/sentry.edge.config.ts`

#### 9. `next.config.ts` — remove `withSentryConfig` wrapper

```ts
// Before:
export default withSentryConfig(nextConfig, { ... });

// After:
export default nextConfig;
```

Also remove the `withSentryConfig` import.

#### 10. Long Task PerformanceObserver

`sentry.client.config.ts` contained a `PerformanceObserver` for long tasks. The equivalent in PostHog is to capture a custom event in `PostHogProvider`'s `useEffect`, after `posthog.init`:

```ts
if (typeof PerformanceObserver !== 'undefined') {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        posthog.capture('$performance_long_task', {
          duration_ms: Math.round(entry.duration),
          start_time: entry.startTime,
        });
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    // Not supported in all browsers — silently ignore.
  }
}
```

---

## Files to Touch — Complete List

### New files

| File                                                 | Purpose                                         |
| ---------------------------------------------------- | ----------------------------------------------- |
| `apps/web/src/shared/components/PostHogProvider.tsx` | Client-side PostHog provider + pageview tracker |
| `apps/web/src/shared/lib/posthog-client.ts`          | Re-exports `posthog` singleton                  |

### Modified files

| File                                                                      | Change                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/web/package.json`                                                   | Remove `@sentry/nextjs`, add `posthog-js`              |
| `apps/web/next.config.ts`                                                 | Remove `withSentryConfig` wrapper                      |
| `apps/web/src/instrumentation.ts`                                         | Clear body; remove Sentry imports                      |
| `apps/web/src/app/layout.tsx`                                             | Add `PostHogProvider` wrapper                          |
| `apps/web/src/shared/lib/env.ts`                                          | Swap Sentry env vars for PostHog                       |
| `apps/web/src/features/spatial-canvas/components/CanvasErrorBoundary.tsx` | `Sentry.captureException` → `posthog.captureException` |

### Deleted files

| File                               |
| ---------------------------------- |
| `apps/web/sentry.client.config.ts` |
| `apps/web/sentry.server.config.ts` |
| `apps/web/sentry.edge.config.ts`   |

---

## Env Var Changes

| Variable                   | Status         | Notes                                                       |
| -------------------------- | -------------- | ----------------------------------------------------------- |
| `SENTRY_DSN`               | Remove         | Server-only Sentry DSN                                      |
| `NEXT_PUBLIC_SENTRY_DSN`   | Remove         | Browser Sentry DSN                                          |
| `SENTRY_AUTH_TOKEN`        | Remove         | Only used in `withSentryConfig` source-maps config          |
| `NEXT_PUBLIC_POSTHOG_KEY`  | Add            | Public PostHog project API key                              |
| `NEXT_PUBLIC_POSTHOG_HOST` | Add (optional) | PostHog ingest host; defaults to `https://us.i.posthog.com` |

---

## Risk Assessment

| Change                                          | Risk                                                                                                        | Mitigation                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Removing `withSentryConfig` next.config wrapper | Low — Sentry wrapper only adds source-map upload and auto-instrumentation (both disabled in current config) | `next build` output unchanged                                  |
| PostHog `posthog-js` adds ~35 KB gzipped        | Medium                                                                                                      | PostHog init is in a client `useEffect` so it never blocks SSR |

---

_This plan requires approval before any application code is touched._
