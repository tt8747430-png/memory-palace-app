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
} from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { roomIdSchema } from '../schemas/room';

const COPY_SUFFIX = ' (copy)';

export type DuplicateRoomResult = {
  id: string;
  palaceId: string;
  title: string;
};

/**
 * Deep-copies a room within the same palace.
 *
 * Copies: room (positioned immediately after the source, sibling positions
 * shifted), all nodes (with positions + verse fields), node→tag links by
 * tag name (idempotent), and intra-room edges (source/target re-mapped).
 *
 * Does **not** copy: cross-room edges, review state, practice sessions —
 * those belong to a node's individual learning history. The duplicate's
 * `prev_room_id` / `next_room_id` linked-list pointers are intentionally
 * left null so the user can re-thread the chapter sequence manually.
 */
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
      // Shift downstream sibling positions by 1 to make room for the copy
      // immediately after the source. Single SQL UPDATE — no per-row loop.
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

        // Re-attach tags by name — idempotent via ON CONFLICT DO NOTHING.
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

        // Copy intra-room edges only — cross-room edges aren't preserved
        // because the user might want to re-link manually. Both endpoints
        // must be in the source room for the edge to be carried forward.
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
