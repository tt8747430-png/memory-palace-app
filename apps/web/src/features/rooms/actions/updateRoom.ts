'use server';

import { revalidatePath } from 'next/cache';
import { getDb, rooms, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { updateRoomSchema } from '../schemas/room';

export const updateRoom = defineAction({
  name: 'updateRoom',
  schema: updateRoomSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, palaceId, ...patch } = input;

    // Ownership check via palace join.
    const [existing] = await getDb()
      .select({ id: rooms.id })
      .from(rooms)
      .innerJoin(
        palaces,
        and(eq(rooms.palaceId, palaces.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .where(and(eq(rooms.id, id), eq(rooms.palaceId, palaceId), isNull(rooms.deletedAt)))
      .limit(1);
    if (!existing) throw new ActionError('NOT_FOUND', 'Room not found.');

    const [updated] = await getDb().update(rooms).set(patch).where(eq(rooms.id, id)).returning();
    if (!updated) throw new ActionError('INTERNAL_ERROR', 'Update returned no row.');
    revalidatePath(`/palaces/${palaceId}`);
    revalidatePath(`/palaces/${palaceId}/rooms/${id}`);
    return updated;
  },
});
