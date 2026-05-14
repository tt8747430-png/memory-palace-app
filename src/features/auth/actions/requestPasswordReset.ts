'use server';

import { createSupabaseFromCookies } from '@/shared/lib/supabase';
import { emailSchema } from '../schemas/credentials';
import { buildCallbackUrl } from '../lib/callbackUrl';
import type { AuthFormState } from './types';

const GENERIC_SUCCESS = 'If an account exists for that email, a password reset link is on its way.';

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createSupabaseFromCookies();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await buildCallbackUrl('/update-password'),
  });

  return { status: 'check-email', message: GENERIC_SUCCESS };
}
