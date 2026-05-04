import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseForProxy } from '@/shared/lib/supabase';

// Public route segments — matched on segment boundaries, not as substrings.
// `/login` matches `/login` and `/login/...` but NOT `/loginhacks`.
const PUBLIC_SEGMENTS = new Set(['login', 'signup', 'about', 'callback']);

function firstSegment(pathname: string): string {
  const i = pathname.indexOf('/', 1);
  return i === -1 ? pathname.slice(1) : pathname.slice(1, i);
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_SEGMENTS.has(firstSegment(pathname));
}

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

function redirectTo(request: NextRequest, source: NextResponse, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  return copyCookies(source, NextResponse.redirect(url));
}

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseForProxy(request);

  // Refresh session — must run with no logic between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const response = getResponse();
  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    return redirectTo(request, response, '/login');
  }

  const seg = firstSegment(pathname);
  if (user && (seg === 'login' || seg === 'signup')) {
    return redirectTo(request, response, '/');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
