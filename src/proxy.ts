import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseForProxy } from '@/shared/lib/supabase';
import { buildCsp } from '@/shared/lib/csp';

const PUBLIC_SEGMENTS = new Set(['login', 'signup', 'callback', 'forgot-password']);

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

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const supabaseResponse = getResponse();
  const { pathname } = request.nextUrl;
  const seg = firstSegment(pathname);
  const csp = buildCsp();

  if (!user && !isPublicPath(pathname)) {
    const r = redirectTo(request, supabaseResponse, '/login');
    r.headers.set('Content-Security-Policy', csp);
    return r;
  }

  if (user && (seg === 'login' || seg === '')) {
    const r = redirectTo(request, supabaseResponse, '/dashboard');
    r.headers.set('Content-Security-Policy', csp);
    return r;
  }

  if (user && seg === 'signup') {
    const step = parseInt(request.nextUrl.searchParams.get('step') ?? '1', 10);
    if (Number.isNaN(step) || step <= 1) {
      const r = redirectTo(request, supabaseResponse, '/dashboard');
      r.headers.set('Content-Security-Policy', csp);
      return r;
    }
  }

  if (!user && seg === '') {
    const r = redirectTo(request, supabaseResponse, '/login');
    r.headers.set('Content-Security-Policy', csp);
    return r;
  }

  const response = NextResponse.next({ request });
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|manifest\\.webmanifest|opengraph-image|apple-icon|icon/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
