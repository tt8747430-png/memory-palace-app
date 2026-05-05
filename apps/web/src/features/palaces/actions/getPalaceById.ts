'use server';

import { getDb, palaces, and, eq, isNull } from '@memory-palace/db';
import type { SelectPalace } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import type { ActionResponse } from '@/shared/types';

export async function getPalaceById(id: string): Promise<ActionResponse<SelectPalace>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  try {
    const db = getDb();
    const [palace] = await db
      .select()
      .from(palaces)
      .where(and(eq(palaces.id, id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .limit(1);

    if (!palace) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Palace not found.' } };
    }

    return { success: true, data: palace };
  } catch (err) {
    console.error('[getPalaceById]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch palace.' },
    };
  }
}
