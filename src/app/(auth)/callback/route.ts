import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseForResponse } from '@/shared/lib/supabase';

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

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  otp_expired: 'Your email link has expired. Request a new one and try again.',
  access_denied: 'The email link could not be used. Request a new one and try again.',
};

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const origin = new URL(request.url).origin;

  const supabaseError = params.get('error_code') ?? params.get('error');
  if (supabaseError) {
    const description = params.get('error_description');
    const message =
      FRIENDLY_ERROR_MESSAGES[supabaseError] ?? description ?? 'Authentication failed.';
    return loginRedirect(origin, message);
  }

  const code = params.get('code');
  if (!code) {
    return loginRedirect(origin, 'Missing authentication code. Please try again.');
  }

  const next = resolveSafeNext(params.get('next'), origin);
  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createSupabaseForResponse(request, response);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginRedirect(origin, 'We could not verify your email. Please try signing in again.');
  }

  return response;
}
