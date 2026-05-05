'use server';

import { getDb, palaces, and, eq, isNull } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import { checkRateLimit } from '@/shared/lib/ratelimit';
import type { ActionResponse } from '@/shared/types';

export async function deletePalace(id: string): Promise<ActionResponse<{ id: string }>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  const { success: rateLimitOk } = await checkRateLimit(user.id, 'write');
  if (!rateLimitOk) {
    return {
      success: false,
      error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please slow down.' },
    };
  }

  try {
    const db = getDb();
    const [deleted] = await db
      .update(palaces)
      .set({ deletedAt: new Date() })
      .where(and(eq(palaces.id, id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .returning({ id: palaces.id });

    if (!deleted) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Palace not found.' } };
    }

    return { success: true, data: { id: deleted.id } };
  } catch (err) {
    console.error('[deletePalace]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete palace.' },
    };
  }
}
