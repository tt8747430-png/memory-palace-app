'use server';

import { redirect } from 'next/navigation';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';
import { credentialsSchema } from '../schemas/credentials';
import { buildCallbackUrl } from '../lib/callbackUrl';
import type { AuthFormState } from './types';

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
    options: { emailRedirectTo: await buildCallbackUrl('/') },
  });
  if (error) return { status: 'error', message: error.message };

  if (data.session) redirect('/dashboard');
  return { status: 'check-email', message: 'Check your email to confirm your account.' };
}
