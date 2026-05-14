'use server';

import { revalidatePath } from 'next/cache';
import { getDb, users, eq } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { updateProfileSchema } from '../schemas/profile';

export const updateProfile = defineAction({
  name: 'updateProfile',
  schema: updateProfileSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const [updated] = await getDb()
      .update(users)
      .set({
        displayName: input.displayName,
        avatarUrl: input.avatarUrl || null,
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl });
    if (!updated) throw new ActionError('NOT_FOUND', 'User profile not found.');
    revalidatePath('/settings/profile');
    revalidatePath('/');
    return updated;
  },
});
