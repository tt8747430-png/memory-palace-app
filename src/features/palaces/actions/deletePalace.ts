'use server';

import { revalidatePath } from 'next/cache';
import { getDb, palaces, and, eq, isNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { signUndoToken } from '@/shared/lib/undoToken';
import { palaceIdSchema } from '../schemas/palace';

export type DeletePalaceResult = {
  id: string;

  undoToken: string;
};

export const deletePalace = defineAction({
  name: 'deletePalace',
  schema: palaceIdSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<DeletePalaceResult> => {
    const [deleted] = await getDb()
      .update(palaces)
      .set({ deletedAt: new Date() })
      .where(and(eq(palaces.id, input.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .returning({ id: palaces.id });
    if (!deleted) throw new ActionError('NOT_FOUND', 'Palace not found.');
    revalidatePath('/palaces');
    revalidatePath('/');
    return {
      id: deleted.id,
      undoToken: signUndoToken({ kind: 'palace.delete', id: deleted.id, userId: user.id }),
    };
  },
});
