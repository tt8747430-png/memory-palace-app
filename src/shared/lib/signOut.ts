'use server';

import { redirect } from 'next/navigation';
import { createSupabaseFromCookies } from '@/shared/lib/supabase';

export async function signOut() {
  const supabase = await createSupabaseFromCookies();
  await supabase.auth.signOut();
  redirect('/login');
}
