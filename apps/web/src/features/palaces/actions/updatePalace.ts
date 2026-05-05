'use server';

import { revalidatePath } from 'next/cache';
import { getDb, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { updatePalaceSchema } from '../schemas/palace';

export const updatePalace = defineAction({
  name: 'updatePalace',
  schema: updatePalaceSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, ...patch } = input;
    const [palace] = await getDb()
      .update(palaces)
      .set(patch)
      .where(and(eq(palaces.id, id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .returning();
    if (!palace) throw new ActionError('NOT_FOUND', 'Palace not found.');
    revalidatePath('/palaces');
    revalidatePath(`/palaces/${id}`);
    revalidatePath('/');
    return palace;
  },
});
