import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op when DSN is absent (local dev without .env.local).
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Sample 20 % of traces in production; 100 % in development.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Session replay: record 10 % of sessions, 100 % on error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        // Mask all user text and block media to protect PII.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Suppress noisy console output in development.
    debug: false,
  });

  // Forward Long Task observations as Sentry breadcrumbs.
  // Runs outside React (raw Web API) — safe for React Compiler output.
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Long task: ${Math.round(entry.duration)}ms`,
            level: 'warning',
            data: { duration: entry.duration, startTime: entry.startTime },
          });
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // PerformanceObserver for longtask is not supported in all browsers; ignore.
    }
  }
}
