'use server';

import { getDb, palaces, and, eq, isNull } from '@memory-palace/db';
import type { SelectPalace } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import { checkRateLimit } from '@/shared/lib/ratelimit';
import type { ActionResponse } from '@/shared/types';
import { updatePalaceSchema } from '../schemas/palace';

export async function updatePalace(input: unknown): Promise<ActionResponse<SelectPalace>> {
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

  const parsed = updatePalaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Invalid input.',
      },
    };
  }

  const { id, ...patch } = parsed.data;

  try {
    const db = getDb();
    const [palace] = await db
      .update(palaces)
      .set(patch)
      .where(and(eq(palaces.id, id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .returning();

    if (!palace) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Palace not found.' } };
    }

    return { success: true, data: palace };
  } catch (err) {
    console.error('[updatePalace]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update palace.' },
    };
  }
}
