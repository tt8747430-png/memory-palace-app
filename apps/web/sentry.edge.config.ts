import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// No-op when DSN is absent (local dev without .env.local).
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Edge runtime has limited Node.js APIs; keep sampling low.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    debug: false,
  });
}
