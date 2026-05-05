'use server';

import { getDb, palaces } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { createPalaceSchema } from '../schemas/palace';

export const createPalace = defineAction({
  name: 'createPalace',
  schema: createPalaceSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const [palace] = await getDb()
      .insert(palaces)
      .values({ userId: user.id, title: input.title, description: input.description })
      .returning();
    if (!palace) throw new ActionError('INTERNAL_ERROR', 'Insert returned no row.');
    return palace;
  },
});
