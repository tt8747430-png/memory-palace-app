import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseForProxy } from '@/shared/lib/supabase';
import { buildCsp } from '@/shared/lib/csp';

// Public route segments — matched on segment boundaries, not as substrings.
// `/login` matches `/login` and `/login/...` but NOT `/loginhacks`.
// Empty string ('') represents the root path `/`.
const PUBLIC_SEGMENTS = new Set([
  '',
  'login',
  'signup',
  'about',
  'join',
  'callback',
  'forgot-password',
]);

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

  // Refresh session — must run with no logic between createServerClient and the
  // auth call. `getClaims()` validates the JWT locally against the project's
  // signing key (no Auth API round-trip on every request), and still triggers
  // the SDK's silent refresh path via the cookie `setAll` callback when the
  // access token is near expiry. Server actions still use `getUser()` where
  // freshest user data matters; the proxy only needs presence + identity.
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

  // Root '/' → /dashboard for authenticated users.
  if (user && (seg === 'login' || seg === 'signup' || seg === '')) {
    const r = redirectTo(request, supabaseResponse, '/dashboard');
    r.headers.set('Content-Security-Policy', csp);
    return r;
  }

  // /join: guests start onboarding at step 1; authenticated users can continue
  // the wizard at step > 1 (e.g. after clicking an email confirmation link).
  if (user && seg === 'join') {
    const step = parseInt(request.nextUrl.searchParams.get('step') ?? '1', 10);
    if (Number.isNaN(step) || step <= 1) {
      const r = redirectTo(request, supabaseResponse, '/dashboard');
      r.headers.set('Content-Security-Policy', csp);
      return r;
    }
  }

  const response = NextResponse.next({ request });
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  // Excludes Next.js internals, image assets, and the metadata routes
  // (robots.txt, sitemap.xml, manifest.webmanifest, opengraph-image, apple-icon,
  // /icon/*) so they don't get auth-redirected to /login. Lighthouse and crawlers
  // need these to return their actual content, not the login page HTML.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|manifest\\.webmanifest|opengraph-image|apple-icon|icon/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
