'use server';

import { getDb, palaces, eq, isNull, and, desc } from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';

export type RecentPalace = {
  id: string;
  title: string;
  description: string | null;
};

export const getRecentPalaces = defineAction({
  name: 'getRecentPalaces',
  handler: async ({ user }): Promise<RecentPalace[]> => {
    return getDb()
      .select({
        id: palaces.id,
        title: palaces.title,
        description: palaces.description,
      })
      .from(palaces)
      .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .orderBy(desc(palaces.createdAt))
      .limit(4);
  },
});
