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

    // Verify the palace belongs to the user before inserting.
    const [palace] = await db
      .select({ id: palaces.id })
      .from(palaces)
      .where(
        and(eq(palaces.id, input.palaceId), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .limit(1);
    if (!palace) throw new ActionError('NOT_FOUND', 'Palace not found.');

    const [room] = await db
      .insert(rooms)
      .values({
        palaceId: input.palaceId,
        title: input.title,
        position: input.position,
      })
      .returning();
    if (!room) throw new ActionError('INTERNAL_ERROR', 'Insert returned no row.');
    revalidatePath(`/palaces/${input.palaceId}`);
    return room;
  },
});
