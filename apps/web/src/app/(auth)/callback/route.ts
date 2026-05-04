import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseForResponse } from '@/shared/lib/supabase';

// Resolves `next` against the request origin and returns a same-origin pathname,
// or `/` for anything that escapes (protocol-relative `//evil.com`, full URLs,
// path traversal, malformed input). Returning a pathname rather than a URL keeps
// callers from accidentally re-using a host they didn't validate.
function resolveSafeNext(rawNext: string | null, origin: string): string {
  if (!rawNext) return '/';
  try {
    const candidate = new URL(rawNext, origin);
    if (candidate.origin !== origin) return '/';
    return candidate.pathname + candidate.search + candidate.hash;
  } catch {
    return '/';
  }
}

function loginRedirect(origin: string, message: string) {
  const url = new URL('/login', origin);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return loginRedirect(requestUrl.origin, 'Missing authentication code. Please try again.');
  }

  const next = resolveSafeNext(requestUrl.searchParams.get('next'), requestUrl.origin);
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  const supabase = createSupabaseForResponse(request, response);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginRedirect(
      requestUrl.origin,
      'We could not verify your email. Please try signing in again.',
    );
  }

  return response;
}
