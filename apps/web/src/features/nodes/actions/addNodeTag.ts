'use server';

import { getDb, tags, nodeTags, nodes, eq, and, isNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { addNodeTagSchema } from '../schemas/node';

export const addNodeTag = defineAction({
  name: 'addNodeTag',
  schema: addNodeTagSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const db = getDb();

    const [node] = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(
        and(
          eq(nodes.id, input.nodeId),
          eq(nodes.roomId, input.roomId),
          eq(nodes.userId, user.id),
          isNull(nodes.deletedAt),
        ),
      )
      .limit(1);
    if (!node) throw new ActionError('NOT_FOUND', 'Node not found.');

    const [tag] = await db
      .insert(tags)
      .values({ userId: user.id, name: input.tagName.trim().toLowerCase() })
      .onConflictDoUpdate({
        target: [tags.userId, tags.name],
        set: { name: tags.name },
      })
      .returning({ id: tags.id, name: tags.name });
    if (!tag) throw new ActionError('INTERNAL_ERROR', 'Tag upsert returned no row.');

    await db.insert(nodeTags).values({ nodeId: input.nodeId, tagId: tag.id }).onConflictDoNothing();

    return tag;
  },
});
