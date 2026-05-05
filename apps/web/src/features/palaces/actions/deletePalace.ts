'use server';

import { getDb, palaces } from '@memory-palace/db';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/shared/lib/supabase';
import type { ActionResponse } from '@/shared/types';

// TODO(rate-limit): add per-user rate limit here — see docs/adr/3b-rate-limiting.md

export async function deletePalace(id: string): Promise<ActionResponse<{ id: string }>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  try {
    const db = getDb();
    // Soft delete: set deleted_at; cascade hard-deletes rooms/nodes/edges handled by DB if needed.
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
