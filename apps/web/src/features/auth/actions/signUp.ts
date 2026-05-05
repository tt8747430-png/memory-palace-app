'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';
import { env } from '@/shared/lib/env';
import { credentialsSchema } from '../schemas/credentials';
import type { AuthFormState } from './types';

async function getCallbackUrl(): Promise<string> {
  // Prefer the explicit env var — header-derived URLs are vulnerable to
  // Host header injection on hosts that don't strictly normalise forwards.
  if (env.NEXT_PUBLIC_SITE_URL) return `${env.NEXT_PUBLIC_SITE_URL}/callback?next=/`;

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'https';
  if (!host) throw new Error('Cannot derive callback URL: missing Host header.');
  return `${proto}://${host}/callback?next=/`;
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createSupabaseFromCookies();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: await getCallbackUrl() },
  });
  if (error) return { status: 'error', message: error.message };

  if (data.session) redirect('/');
  return { status: 'check-email', message: 'Check your email to confirm your account.' };
}
