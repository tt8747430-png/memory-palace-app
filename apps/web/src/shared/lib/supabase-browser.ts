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
 */
let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      realtime: {
        params: {
          // Prevent the realtime client from trying to use the eventsPerSecond
          // throttle, which is a server-side concept.
          eventsPerSecond: 10,
        },
      },
    },
  );

  return browserClient;
}
