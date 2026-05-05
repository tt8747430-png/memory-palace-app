'use server';

import { revalidatePath } from 'next/cache';
import { getDb, rooms, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { createRoomSchema } from '../schemas/room';

export const createRoom = defineAction({
  name: 'createRoom',
  schema: createRoomSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const db = getDb();

    // Transaction ensures atomicity — no TOCTOU gap between the palace
    // ownership check and the room insert.
    const room = await db.transaction(async (tx) => {
      const [palace] = await tx
        .select({ id: palaces.id })
        .from(palaces)
        .where(
          and(
            eq(palaces.id, input.palaceId),
            eq(palaces.userId, user.id),
            isNull(palaces.deletedAt),
          ),
        )
        .limit(1);
      if (!palace) throw new ActionError('NOT_FOUND', 'Palace not found.');

      const [created] = await tx
        .insert(rooms)
        .values({
          palaceId: input.palaceId,
          title: input.title,
          position: input.position,
        })
        .returning();
      if (!created) throw new ActionError('INTERNAL_ERROR', 'Insert returned no row.');
      return created;
    });

    revalidatePath(`/palaces/${input.palaceId}`);
    return room;
  },
});
