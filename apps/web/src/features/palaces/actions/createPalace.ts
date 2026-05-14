'use server';

import { revalidatePath } from 'next/cache';
import { getDb, palaces } from '@/db';
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
      .returning({
        id: palaces.id,
        title: palaces.title,
        description: palaces.description,
        createdAt: palaces.createdAt,
        updatedAt: palaces.updatedAt,
      });
    if (!palace) throw new ActionError('INTERNAL_ERROR', 'Insert returned no row.');
    revalidatePath('/palaces');
    revalidatePath('/');
    return palace;
  },
});
