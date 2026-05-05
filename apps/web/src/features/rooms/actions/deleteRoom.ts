'use server';

import { revalidatePath } from 'next/cache';
import { getDb, rooms, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { roomIdSchema } from '../schemas/room';

export const deleteRoom = defineAction({
  name: 'deleteRoom',
  schema: roomIdSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, palaceId } = input;

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

    const [deleted] = await getDb()
      .update(rooms)
      .set({ deletedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning({ id: rooms.id });
    if (!deleted) throw new ActionError('INTERNAL_ERROR', 'Soft delete returned no row.');
    revalidatePath(`/palaces/${palaceId}`);
    return { id: deleted.id };
  },
});
