import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { env } from './env';

export async function createSupabaseFromCookies() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Silently ignored when called from a Server Component — cookie
            // writes are not allowed outside Server Actions / Route Handlers.
            // Session refresh is handled by the proxy on every request.
          }
        },
      },
    },
  );
}

export function createSupabaseForResponse(request: NextRequest, response: NextResponse) {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
}

/**
 * Proxy-side Supabase client. Owns its own NextResponse: the proxy never holds
 * the response in a `let`. Call `getResponse()` after `getUser()` to retrieve
 * the response that carries the refreshed session cookies.
 */
export function createSupabaseForProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  return {
    supabase,
    getResponse: () => response,
  };
}

/**
 * Resolve the current user once per request. Wrapped in React's `cache()` so
 * multiple server actions (or RSCs) firing in the same request share one
 * `getUser()` round-trip instead of N.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseFromCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
