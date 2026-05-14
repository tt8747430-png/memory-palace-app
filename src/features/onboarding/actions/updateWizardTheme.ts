'use server';

import { z } from 'zod';
import { getDb, palaces, eq, and } from '@/db';
import { defineAction } from '@/shared/lib/action';

const schema = z.object({
  palaceId: z.uuid(),
  color: z.string().max(32).optional(),
  icon: z.string().max(10).optional(),
});

export const updateWizardTheme = defineAction({
  name: 'updateWizardTheme',
  schema,
  handler: async ({ user, input }) => {
    await getDb()
      .update(palaces)
      .set({ color: input.color, icon: input.icon })
      .where(and(eq(palaces.id, input.palaceId), eq(palaces.userId, user.id)));
  },
});
