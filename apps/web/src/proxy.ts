import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseFromRequest } from '@/shared/lib/supabase';

const PUBLIC_PREFIXES = ['/login', '/signup', '/about', '/callback'];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function redirectWithCookies(request: NextRequest, source: NextResponse, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createSupabaseFromRequest(request, (cookiesToSet) => {
    supabaseResponse = NextResponse.next({ request });
    cookiesToSet.forEach(({ name, value, options }) =>
      supabaseResponse.cookies.set(name, value, options),
    );
  });

  // Refresh session — must not run any logic between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    return redirectWithCookies(request, supabaseResponse, '/login');
  }

  if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return redirectWithCookies(request, supabaseResponse, '/');
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
