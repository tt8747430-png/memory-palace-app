'use server';

import { getDb, nodes, and, eq, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { updateNodePositionSchema } from '../schemas/node';

/** Persists final XY after a drag-drop. No revalidatePath — the canvas is
 * the authoritative view of positions and updates optimistically via Zustand. */
export const updateNodePosition = defineAction({
  name: 'updateNodePosition',
  schema: updateNodePositionSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, roomId, positionX, positionY } = input;

    const [updated] = await getDb()
      .update(nodes)
      .set({ positionX, positionY })
      .where(
        and(
          eq(nodes.id, id),
          eq(nodes.roomId, roomId),
          eq(nodes.userId, user.id),
          isNull(nodes.deletedAt),
        ),
      )
      .returning({ id: nodes.id, positionX: nodes.positionX, positionY: nodes.positionY });
    if (!updated) throw new ActionError('NOT_FOUND', 'Node not found.');

    return updated;
  },
});
