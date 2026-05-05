'use server';

import { getDb, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { palaceIdSchema } from '../schemas/palace';

export const deletePalace = defineAction({
  name: 'deletePalace',
  schema: palaceIdSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const [deleted] = await getDb()
      .update(palaces)
      .set({ deletedAt: new Date() })
      .where(and(eq(palaces.id, input.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .returning({ id: palaces.id });
    if (!deleted) throw new ActionError('NOT_FOUND', 'Palace not found.');
    return { id: deleted.id };
  },
});
