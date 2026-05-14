import { type DbTx, nodeTags, tags, and, eq, inArray } from '@/db';

export async function reattachNodeTags(
  tx: DbTx,
  sourceTagLinks: Array<{ nodeId: string; tagName: string }>,
  nodeIdMap: Map<string, string>,
  userId: string,
): Promise<void> {
  if (sourceTagLinks.length === 0) return;

  const tagNames = Array.from(new Set(sourceTagLinks.map((t) => t.tagName)));
  const existingTags = await tx
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, tagNames)));
  const tagByName = new Map(existingTags.map((t) => [t.name, t.id]));

  const links = sourceTagLinks
    .map((link) => {
      const newNodeId = nodeIdMap.get(link.nodeId);
      const tagId = tagByName.get(link.tagName);
      if (!newNodeId || !tagId) return null;
      return { nodeId: newNodeId, tagId };
    })
    .filter((x): x is { nodeId: string; tagId: string } => x !== null);

  if (links.length > 0) {
    await tx.insert(nodeTags).values(links).onConflictDoNothing();
  }
}
