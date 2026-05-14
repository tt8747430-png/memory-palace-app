'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  rooms,
  nodes,
  edges,
  nodeTags,
  tags,
  palaces,
  and,
  asc,
  eq,
  inArray,
  isNull,
  sql,
} from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { reattachNodeTags } from '@/shared/lib/reattachNodeTags';
import { roomIdSchema } from '../schemas/room';

const COPY_SUFFIX = ' (copy)';

export type DuplicateRoomResult = {
  id: string;
  palaceId: string;
  title: string;
};

export const duplicateRoom = defineAction({
  name: 'duplicateRoom',
  schema: roomIdSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<DuplicateRoomResult> => {
    const db = getDb();

    const [source] = await db
      .select()
      .from(rooms)
      .innerJoin(palaces, eq(palaces.id, rooms.palaceId))
      .where(
        and(
          eq(rooms.id, input.id),
          eq(rooms.palaceId, input.palaceId),
          isNull(rooms.deletedAt),
          eq(palaces.userId, user.id),
          isNull(palaces.deletedAt),
        ),
      )
      .limit(1);
    if (!source) throw new ActionError('NOT_FOUND', 'Room not found.');

    const sourceRoom = source.rooms;

    const created = await db.transaction(async (tx) => {
      await tx
        .update(rooms)
        .set({ position: sql`${rooms.position} + 1` })
        .where(
          and(
            eq(rooms.palaceId, sourceRoom.palaceId),
            isNull(rooms.deletedAt),
            sql`${rooms.position} > ${sourceRoom.position}`,
          ),
        );

      const [room] = await tx
        .insert(rooms)
        .values({
          palaceId: sourceRoom.palaceId,
          title: `${sourceRoom.title}${COPY_SUFFIX}`,
          position: sourceRoom.position + 1,
        })
        .returning();
      if (!room) throw new ActionError('INTERNAL_ERROR', 'Room insert returned no row.');

      const sourceNodes = await tx
        .select()
        .from(nodes)
        .where(and(eq(nodes.roomId, sourceRoom.id), isNull(nodes.deletedAt)))
        .orderBy(asc(nodes.createdAt));

      const nodeIdMap = new Map<string, string>();
      if (sourceNodes.length > 0) {
        const insertedNodes = await tx
          .insert(nodes)
          .values(
            sourceNodes.map((n) => ({
              roomId: room.id,
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
          .select({ nodeId: nodeTags.nodeId, tagName: tags.name })
          .from(nodeTags)
          .innerJoin(tags, eq(tags.id, nodeTags.tagId))
          .where(
            inArray(
              nodeTags.nodeId,
              sourceNodes.map((n) => n.id),
            ),
          );

        await reattachNodeTags(tx, sourceTagLinks, nodeIdMap, user.id);

        const sourceNodeIds = sourceNodes.map((n) => n.id);
        const sourceEdges = await tx
          .select()
          .from(edges)
          .where(
            and(
              inArray(edges.sourceNodeId, sourceNodeIds),
              inArray(edges.targetNodeId, sourceNodeIds),
            ),
          );

        if (sourceEdges.length > 0) {
          const edgeRows = sourceEdges
            .map((e) => {
              const src = nodeIdMap.get(e.sourceNodeId);
              const tgt = nodeIdMap.get(e.targetNodeId);
              if (!src || !tgt) return null;
              return { sourceNodeId: src, targetNodeId: tgt, label: e.label };
            })
            .filter(
              (x): x is { sourceNodeId: string; targetNodeId: string; label: string | null } =>
                x !== null,
            );
          if (edgeRows.length > 0) {
            await tx.insert(edges).values(edgeRows).onConflictDoNothing();
          }
        }
      }

      return room;
    });

    revalidatePath(`/palaces/${sourceRoom.palaceId}`);
    return { id: created.id, palaceId: created.palaceId, title: created.title };
  },
});
