'use server';

import { getDb, rooms, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { roomIdSchema } from '../schemas/room';

export const getRoomById = defineAction({
  name: 'getRoomById',
  schema: roomIdSchema,
  handler: async ({ user, input }) => {
    // Join to palace to enforce ownership without a separate check.
    const [row] = await getDb()
      .select({
        id: rooms.id,
        palaceId: rooms.palaceId,
        title: rooms.title,
        position: rooms.position,
        createdAt: rooms.createdAt,
        updatedAt: rooms.updatedAt,
        deletedAt: rooms.deletedAt,
      })
      .from(rooms)
      .innerJoin(
        palaces,
        and(eq(rooms.palaceId, palaces.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .where(
        and(eq(rooms.id, input.id), eq(rooms.palaceId, input.palaceId), isNull(rooms.deletedAt)),
      )
      .limit(1);
    if (!row) throw new ActionError('NOT_FOUND', 'Room not found.');
    return row;
  },
});
