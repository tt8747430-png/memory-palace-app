'use server';

import { getDb, nodes, rooms, palaces, and, asc, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { getRoomNodesSchema } from '../schemas/node';

/** Returns all non-deleted nodes for a room, ordered by creation time.
 * Intended for the canvas view — no cursor pagination here.
 * Hard cap of 500 nodes per room keeps response sizes bounded. */
export const getRoomNodes = defineAction({
  name: 'getRoomNodes',
  schema: getRoomNodesSchema,
  handler: async ({ user, input }) => {
    // Verify the room belongs to the user via palace ownership.
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
