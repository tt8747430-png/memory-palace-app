'use server';

import { redirect } from 'next/navigation';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';
import { passwordSchema } from '../schemas/credentials';
import type { AuthFormState } from './types';

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createSupabaseFromCookies();

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: 'error', message: error.message };

  redirect('/');
}
