'use server';

import { revalidatePath } from 'next/cache';
import { getDb, nodes, rooms, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { updateNodeSchema } from '../schemas/node';

export const updateNode = defineAction({
  name: 'updateNode',
  schema: updateNodeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, roomId, ...patch } = input;

    // Ownership: nodes.userId is denormalized — one condition is sufficient.
    const [updated] = await getDb()
      .update(nodes)
      .set(patch)
      .where(
        and(
          eq(nodes.id, id),
          eq(nodes.roomId, roomId),
          eq(nodes.userId, user.id),
          isNull(nodes.deletedAt),
        ),
      )
      .returning();
    if (!updated) throw new ActionError('NOT_FOUND', 'Node not found.');

    // Derive palace for path revalidation via rooms join.
    const [room] = await getDb()
      .select({ palaceId: rooms.palaceId })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);
    if (room) revalidatePath(`/palaces/${room.palaceId}/rooms/${roomId}`);

    return updated;
  },
});
