import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// No-op when DSN is absent (local dev without .env.local).
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Sample 20 % of traces in production; 100 % in development.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    debug: false,
  });
}
