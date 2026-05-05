'use server';

import { getDb, rooms, palaces, and, eq, isNull, asc } from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';
import { getRoomsSchema } from '../schemas/room';

export const getRooms = defineAction({
  name: 'getRooms',
  schema: getRoomsSchema,
  handler: async ({ user, input }) => {
    // Single JOIN verifies palace ownership and fetches rooms in one round-trip.
    return getDb()
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
      .where(and(eq(rooms.palaceId, input.palaceId), isNull(rooms.deletedAt)))
      .orderBy(asc(rooms.position), asc(rooms.createdAt));
  },
});
