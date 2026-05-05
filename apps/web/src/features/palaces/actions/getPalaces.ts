'use server';

import { getDb, palaces, and, eq, isNull, desc } from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';

export const getPalaces = defineAction({
  name: 'getPalaces',
  handler: async ({ user }) => {
    return getDb()
      .select()
      .from(palaces)
      .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .orderBy(desc(palaces.createdAt));
  },
});
