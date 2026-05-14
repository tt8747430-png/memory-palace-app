'use server';

import { z } from 'zod';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';
import { buildCallbackUrl } from '@/shared/lib/callbackUrl';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export interface WizardAccountState {
  status: 'idle' | 'ok' | 'check-email' | 'error';
  message?: string;
}

export async function createWizardAccount(
  _prev: WizardAccountState,
  formData: FormData,
): Promise<WizardAccountState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createSupabaseFromCookies();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: await buildCallbackUrl('/signup?step=2') },
  });

  if (error) return { status: 'error', message: error.message };

  if (data.session) return { status: 'ok' };

  return { status: 'check-email', message: 'Check your email to confirm, then return here.' };
}
