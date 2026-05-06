import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Browser-side Supabase client — singleton.
 *
 * Used **only** for Supabase Realtime subscriptions. All data mutations
 * continue through Server Actions (which use the server-side SSR client).
 *
 * This is the first browser-side Supabase client in the codebase, introduced
 * in Phase 5C for cross-device realtime sync. See docs/adr/5c-realtime-sync.md.
 *
 * Stored on `globalThis` so Next.js HMR module re-execution in development
 * reuses the existing instance instead of creating a new one and leaking the
 * old WebSocket connection. Production has no HMR, so the guard is free.
 */
const globalForBrowser = globalThis as unknown as {
  __mpSupabaseBrowser?: SupabaseClient;
};

export function createSupabaseBrowser(): SupabaseClient {
  if (globalForBrowser.__mpSupabaseBrowser) return globalForBrowser.__mpSupabaseBrowser;

  globalForBrowser.__mpSupabaseBrowser = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
  );

  return globalForBrowser.__mpSupabaseBrowser;
}
