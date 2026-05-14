'use server';

import { getDb, nodes, rooms, palaces, and, eq, isNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { createNodeSchema } from '../schemas/node';

export const createNode = defineAction({
  name: 'createNode',
  schema: createNodeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const db = getDb();

    return db.transaction(async (tx) => {
      const [room] = await tx
        .select({ id: rooms.id })
        .from(rooms)
        .innerJoin(
          palaces,
          and(
            eq(rooms.palaceId, palaces.id),
            eq(palaces.userId, user.id),
            isNull(palaces.deletedAt),
          ),
        )
        .where(and(eq(rooms.id, input.roomId), isNull(rooms.deletedAt)))
        .limit(1);
      if (!room) throw new ActionError('NOT_FOUND', 'Room not found.');

      const [created] = await tx
        .insert(nodes)
        .values({
          roomId: input.roomId,
          userId: user.id,
          title: input.title,
          content: input.content,
          nodeType: input.nodeType,
          positionX: input.positionX,
          positionY: input.positionY,
          color: input.color,
        })
        .returning({
          id: nodes.id,
          roomId: nodes.roomId,
          title: nodes.title,
          content: nodes.content,
          nodeType: nodes.nodeType,
          positionX: nodes.positionX,
          positionY: nodes.positionY,
          color: nodes.color,
          createdAt: nodes.createdAt,
          updatedAt: nodes.updatedAt,
        });
      if (!created) throw new ActionError('INTERNAL_ERROR', 'Insert returned no row.');
      return created;
    });
  },
});
