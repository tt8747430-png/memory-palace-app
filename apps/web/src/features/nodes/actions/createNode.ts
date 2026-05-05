'use server';

import { revalidatePath } from 'next/cache';
import { getDb, nodes, rooms, palaces, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { createNodeSchema } from '../schemas/node';

export const createNode = defineAction({
  name: 'createNode',
  schema: createNodeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    // Verify the room belongs to the user via palace ownership.
    const [room] = await getDb()
      .select({ id: rooms.id, palaceId: rooms.palaceId })
      .from(rooms)
      .innerJoin(
        palaces,
        and(eq(rooms.palaceId, palaces.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .where(and(eq(rooms.id, input.roomId), isNull(rooms.deletedAt)))
      .limit(1);
    if (!room) throw new ActionError('NOT_FOUND', 'Room not found.');

    const [node] = await getDb()
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
      .returning();
    if (!node) throw new ActionError('INTERNAL_ERROR', 'Insert returned no row.');

    revalidatePath(`/palaces/${room.palaceId}/rooms/${input.roomId}`);
    revalidatePath('/');
    return node;
  },
});
