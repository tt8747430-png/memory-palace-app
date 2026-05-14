import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

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
