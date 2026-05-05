'use server';

import { getDb, palaces, and, eq, isNull, desc } from '@memory-palace/db';
import type { SelectPalace } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import type { ActionResponse } from '@/shared/types';

export async function getPalaces(): Promise<ActionResponse<SelectPalace[]>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(palaces)
      .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .orderBy(desc(palaces.createdAt));

    return { success: true, data: rows };
  } catch (err) {
    console.error('[getPalaces]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch palaces.' },
    };
  }
}
