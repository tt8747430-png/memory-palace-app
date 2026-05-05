'use server';

import { getDb, palaces } from '@memory-palace/db';
import type { SelectPalace } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import type { ActionResponse } from '@/shared/types';
import { createPalaceSchema } from '../schemas/palace';

// TODO(rate-limit): add per-user rate limit here — see docs/adr/3b-rate-limiting.md

export async function createPalace(input: unknown): Promise<ActionResponse<SelectPalace>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  const parsed = createPalaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Invalid input.',
      },
    };
  }

  try {
    const db = getDb();
    const [palace] = await db
      .insert(palaces)
      .values({
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
      })
      .returning();

    return { success: true, data: palace };
  } catch (err) {
    console.error('[createPalace]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create palace.' },
    };
  }
}
