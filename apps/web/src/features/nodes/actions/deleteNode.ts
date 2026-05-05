'use server';

import { getDb, nodes, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { deleteNodeSchema } from '../schemas/node';

export const deleteNode = defineAction({
  name: 'deleteNode',
  schema: deleteNodeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, roomId } = input;

    const [deleted] = await getDb()
      .update(nodes)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(nodes.id, id),
          eq(nodes.roomId, roomId),
          eq(nodes.userId, user.id),
          isNull(nodes.deletedAt),
        ),
      )
      .returning({ id: nodes.id });
    if (!deleted) throw new ActionError('NOT_FOUND', 'Node not found.');

    // No revalidatePath — the canvas owns its state through TanStack Query's
    // optimistic cache + invalidateQueries, consistent with updateNode and
    // updateNodePosition.
    return { id: deleted.id };
  },
});
