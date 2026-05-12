'use server';

import { getDb, nodes, rooms, palaces, and, asc, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { getRoomNodesSchema } from '../schemas/node';

export const getRoomNodes = defineAction({
  name: 'getRoomNodes',
  schema: getRoomNodesSchema,
  handler: async ({ user, input }) => {
    const [room] = await getDb()
      .select({ id: rooms.id })
      .from(rooms)
      .innerJoin(
        palaces,
        and(eq(rooms.palaceId, palaces.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .where(and(eq(rooms.id, input.roomId), isNull(rooms.deletedAt)))
      .limit(1);
    if (!room) throw new ActionError('NOT_FOUND', 'Room not found.');

    return getDb()
      .select()
      .from(nodes)
      .where(
        and(eq(nodes.roomId, input.roomId), eq(nodes.userId, user.id), isNull(nodes.deletedAt)),
      )
      .orderBy(asc(nodes.createdAt), asc(nodes.id))
      .limit(500);
  },
});
