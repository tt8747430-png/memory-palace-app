'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from '@posthog/react';
import { useEffect, Suspense, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
    if (!key) return;
    posthog.init(key, {
      api_host: host,
      ui_host: 'https://eu.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,
      },
    });

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
      } catch {}
    }
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
