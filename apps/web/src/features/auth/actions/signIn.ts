'use server';

import { redirect } from 'next/navigation';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';
import { credentialsSchema } from '../schemas/credentials';
import type { AuthFormState } from './types';

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createSupabaseFromCookies();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: 'error', message: error.message };
  }

  redirect('/dashboard');
}
