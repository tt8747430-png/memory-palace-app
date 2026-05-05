'use server';

import { getDb, users, eq } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';

export const getProfile = defineAction({
  name: 'getProfile',
  handler: async ({ user }) => {
    const [profile] = await getDb()
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!profile) throw new ActionError('NOT_FOUND', 'Profile not found.');
    return { ...profile, email: user.email ?? null };
  },
});
