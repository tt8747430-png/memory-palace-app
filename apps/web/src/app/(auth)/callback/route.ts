import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseForResponse } from '@/shared/lib/supabase';

function getSafeRedirectPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) return '/';
  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get('next'));

  if (!code) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'Missing authentication code. Please try again.');
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  const supabase = createSupabaseForResponse(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set(
      'error',
      'We could not verify your email. Please try signing in again.',
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
