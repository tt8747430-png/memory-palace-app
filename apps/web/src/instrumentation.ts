// Next.js instrumentation hook — registered once per server cold start.
// Loads the correct Sentry SDK (Node.js vs Edge runtime) based on the
// runtime environment. Must not call getDb() or read cookies.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
