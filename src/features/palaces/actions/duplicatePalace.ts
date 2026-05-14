'use server';

import { revalidatePath } from 'next/cache';
import { getDb, palaces, rooms, nodes, nodeTags, tags, and, asc, eq, inArray, isNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { palaceIdSchema } from '../schemas/palace';

export type DuplicatePalaceResult = {
  id: string;
  title: string;
};

const COPY_SUFFIX = ' (copy)';

export const duplicatePalace = defineAction({
  name: 'duplicatePalace',
  schema: palaceIdSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<DuplicatePalaceResult> => {
    const db = getDb();

    const [source] = await db
      .select()
      .from(palaces)
      .where(and(eq(palaces.id, input.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .limit(1);
    if (!source) throw new ActionError('NOT_FOUND', 'Palace not found.');

    const created = await db.transaction(async (tx) => {
      const [palace] = await tx
        .insert(palaces)
        .values({
          userId: user.id,
          title: `${source.title}${COPY_SUFFIX}`,
          description: source.description,
          color: source.color,
          icon: source.icon,
          mode: source.mode,
        })
        .returning();
      if (!palace) throw new ActionError('INTERNAL_ERROR', 'Palace insert returned no row.');

      const sourceRooms = await tx
        .select()
        .from(rooms)
        .where(and(eq(rooms.palaceId, source.id), isNull(rooms.deletedAt)))
        .orderBy(asc(rooms.position));

      const roomIdMap = new Map<string, string>();
      if (sourceRooms.length > 0) {
        const insertedRooms = await tx
          .insert(rooms)
          .values(
            sourceRooms.map((r) => ({
              palaceId: palace.id,
              title: r.title,
              position: r.position,
            })),
          )
          .returning({ id: rooms.id, position: rooms.position });

        const sortedNew = insertedRooms.slice().sort((a, b) => a.position - b.position);
        const sortedOld = sourceRooms.slice().sort((a, b) => a.position - b.position);
        sortedOld.forEach((r, i) => {
          const newId = sortedNew[i]?.id;
          if (newId) roomIdMap.set(r.id, newId);
        });
      }

      const sourceRoomIds = sourceRooms.map((r) => r.id);
      const sourceNodes = sourceRoomIds.length
        ? await tx
            .select()
            .from(nodes)
            .where(and(inArray(nodes.roomId, sourceRoomIds), isNull(nodes.deletedAt)))
        : [];

      const nodeIdMap = new Map<string, string>();
      if (sourceNodes.length > 0) {
        const insertedNodes = await tx
          .insert(nodes)
          .values(
            sourceNodes.map((n) => ({
              roomId: roomIdMap.get(n.roomId) ?? n.roomId,
              userId: user.id,
              title: n.title,
              content: n.content,
              nodeType: n.nodeType,
              positionX: n.positionX,
              positionY: n.positionY,
              color: n.color,
              verseHint: n.verseHint,
              bibleRef: n.bibleRef,
            })),
          )
          .returning({ id: nodes.id });
        sourceNodes.forEach((n, i) => {
          const newId = insertedNodes[i]?.id;
          if (newId) nodeIdMap.set(n.id, newId);
        });

        const sourceTagLinks = await tx
          .select({
            nodeId: nodeTags.nodeId,
            tagName: tags.name,
          })
          .from(nodeTags)
          .innerJoin(tags, eq(tags.id, nodeTags.tagId))
          .where(
            inArray(
              nodeTags.nodeId,
              sourceNodes.map((n) => n.id),
            ),
          );

        if (sourceTagLinks.length > 0) {
          const tagNames = Array.from(new Set(sourceTagLinks.map((t) => t.tagName)));
          const existingTags = await tx
            .select({ id: tags.id, name: tags.name })
            .from(tags)
            .where(and(eq(tags.userId, user.id), inArray(tags.name, tagNames)));
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
      }

      return palace;
    });

    revalidatePath('/palaces');
    revalidatePath('/');
    return { id: created.id, title: created.title };
  },
});
