'use server';

import { getDb, nodes, and, eq, isNull } from '@memory-palace/db';
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
      .returning({
        id: nodes.id,
        title: nodes.title,
        nodeType: nodes.nodeType,
        color: nodes.color,
        updatedAt: nodes.updatedAt,
      });
    if (!updated) throw new ActionError('NOT_FOUND', 'Node not found.');

    // No revalidatePath — the canvas owns its state through TanStack Query's
    // optimistic cache + invalidateQueries. An RSC re-render would race against
    // the already-confirmed optimistic value and serve stale initialNodes.
    return updated;
  },
});
