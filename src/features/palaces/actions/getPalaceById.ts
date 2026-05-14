'use server';

import { getDb, palaces, and, eq, isNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { palaceIdSchema } from '../schemas/palace';

export const getPalaceById = defineAction({
  name: 'getPalaceById',
  schema: palaceIdSchema,
  handler: async ({ user, input }) => {
    const [palace] = await getDb()
      .select()
      .from(palaces)
      .where(and(eq(palaces.id, input.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .limit(1);
    if (!palace) throw new ActionError('NOT_FOUND', 'Palace not found.');
    return palace;
  },
});
