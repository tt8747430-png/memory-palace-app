'use server';

import { getDb, rooms, palaces, and, eq, isNull, asc } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { getRoomsSchema } from '../schemas/room';

export const getRooms = defineAction({
  name: 'getRooms',
  schema: getRoomsSchema,
  handler: async ({ user, input }) => {
    // Verify palace ownership before exposing room list.
    const [palace] = await getDb()
      .select({ id: palaces.id })
      .from(palaces)
      .where(
        and(eq(palaces.id, input.palaceId), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .limit(1);
    if (!palace) throw new ActionError('NOT_FOUND', 'Palace not found.');

    return getDb()
      .select()
      .from(rooms)
      .where(and(eq(rooms.palaceId, input.palaceId), isNull(rooms.deletedAt)))
      .orderBy(asc(rooms.position), asc(rooms.createdAt));
  },
});
