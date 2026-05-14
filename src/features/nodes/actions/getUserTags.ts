'use server';

import { getDb, tags, eq, and, ilike } from '@/db';
import { defineAction } from '@/shared/lib/action';
import { getUserTagsSchema } from '../schemas/node';

export const getUserTags = defineAction({
  name: 'getUserTags',
  schema: getUserTagsSchema,
  handler: async ({ user, input }) => {
    const db = getDb();
    const conditions = [eq(tags.userId, user.id)];
    if (input.search) {
      conditions.push(ilike(tags.name, `%${input.search}%`));
    }
    return db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(and(...conditions))
      .limit(50);
  },
});
