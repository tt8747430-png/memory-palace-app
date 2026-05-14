'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb, palaces, and, eq, isNotNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { verifyUndoToken } from '@/shared/lib/undoToken';

const restorePalaceSchema = z.object({
  undoToken: z.string().min(1, 'Missing undo token'),
});

export type RestorePalaceResult = { id: string };

export const restorePalace = defineAction({
  name: 'restorePalace',
  schema: restorePalaceSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<RestorePalaceResult> => {
    const payload = verifyUndoToken<'palace.delete'>(input.undoToken, 'palace.delete');
    if (!payload) throw new ActionError('VALIDATION_FAILED', 'Undo token expired or invalid.');
    if (payload.userId !== user.id) throw new ActionError('FORBIDDEN', 'Token does not match.');

    const [restored] = await getDb()
      .update(palaces)
      .set({ deletedAt: null })
      .where(
        and(eq(palaces.id, payload.id), eq(palaces.userId, user.id), isNotNull(palaces.deletedAt)),
      )
      .returning({ id: palaces.id });
    if (!restored) throw new ActionError('NOT_FOUND', 'Palace already restored or missing.');
    revalidatePath('/palaces');
    revalidatePath('/');
    return { id: restored.id };
  },
});
