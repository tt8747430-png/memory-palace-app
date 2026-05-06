'use server';

import { getDb, nodeTags, nodes, eq, and, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { removeNodeTagSchema } from '../schemas/node';

export const removeNodeTag = defineAction({
  name: 'removeNodeTag',
  schema: removeNodeTagSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const db = getDb();

    // Ownership: verify the node belongs to the user before unlinking the tag.
    const [nodeRow] = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(and(eq(nodes.id, input.nodeId), eq(nodes.userId, user.id), isNull(nodes.deletedAt)))
      .limit(1);
    if (!nodeRow) throw new ActionError('NOT_FOUND', 'Node not found.');

    await db
      .delete(nodeTags)
      .where(and(eq(nodeTags.nodeId, input.nodeId), eq(nodeTags.tagId, input.tagId)));

    return { nodeId: input.nodeId, tagId: input.tagId };
  },
});
