'use server';

import { redirect } from 'next/navigation';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';

/** Signs the current user out and redirects to /login. */
export async function signOut() {
  const supabase = await createSupabaseFromCookies();
  await supabase.auth.signOut();
  redirect('/login');
}
