// Server-only module — imported from the dashboard layout (a Server Component).
// No 'use server' needed; this is not a client-callable action.

import { getDb, users, eq } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';

export type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  email: string | null;
};

/** Shared server action — fetches the current user's profile row. */
export const getUserProfile = defineAction({
  name: 'getUserProfile',
  handler: async ({ user }): Promise<UserProfile> => {
    const [row] = await getDb()
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!row) throw new ActionError('NOT_FOUND', 'Profile not found.');
    return { ...row, email: user.email ?? null };
  },
});
