'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useCrossTabSync } from '@/shared/hooks/useCrossTabSync';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 s — avoids background refetches for
        // data the user hasn't changed. Each canvas query can override this.
        staleTime: 30_000,
        // Retry once on failure before surfacing an error to the UI.
        retry: 1,
      },
    },
  });
}

/** Mounts the cross-tab sync listener inside the QueryClientProvider tree. */
function CrossTabSyncMount() {
  useCrossTabSync();
  return null;
}

/** Wraps the subtree with a TanStack Query client.
 *
 * Instantiated via useState factory so the same QueryClient instance survives
 * re-renders without leaking across concurrent server-rendered requests. Place
 * this at the (dashboard) layout level — not the root layout — to keep the
 * canvas bundle out of auth and marketing pages. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={client}>
      <CrossTabSyncMount />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
