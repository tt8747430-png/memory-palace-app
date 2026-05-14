'use server';

import { z } from 'zod';
import { getDb, palaces, rooms } from '@/db';
import { defineAction } from '@/shared/lib/action';

const schema = z.object({
  name: z
    .string()
    .min(1, 'Palace name is required')
    .max(100, 'Palace name must be 100 characters or less'),
});

export interface WizardSetupResult {
  palaceId: string;
  roomId: string;
}

export const createWizardSetup = defineAction({
  name: 'createWizardSetup',
  schema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    return getDb().transaction(async (tx) => {
      const [palace] = await tx
        .insert(palaces)
        .values({ userId: user.id, title: input.name })
        .returning({ id: palaces.id });

      if (!palace) throw new Error('Palace insert returned no row.');

      const [room] = await tx
        .insert(rooms)
        .values({ palaceId: palace.id, title: 'Main Room', position: 0 })
        .returning({ id: rooms.id });

      if (!room) throw new Error('Room insert returned no row.');

      return { palaceId: palace.id, roomId: room.id };
    });
  },
});
