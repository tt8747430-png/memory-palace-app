import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/shared/lib/supabase';
import { checkRateLimit } from '@/shared/lib/ratelimit';
import { getDb, palaces, rooms, nodes, eq, isNull, and, asc } from '@memory-palace/db';
import type {
  ExportDataV1,
  ExportPalace,
  ExportRoom,
} from '@/features/palaces/schemas/dataTransfer';

export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: withinLimit } = await checkRateLimit(user.id, 'search');
  if (!withinLimit) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  // ── Fetch all non-deleted data for this user ───────────────────────────────
  const db = getDb();

  const [userPalaces, userRooms, userNodes] = await Promise.all([
    db
      .select({
        id: palaces.id,
        title: palaces.title,
        description: palaces.description,
        createdAt: palaces.createdAt,
      })
      .from(palaces)
      .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .orderBy(asc(palaces.createdAt)),

    db
      .select({
        id: rooms.id,
        palaceId: rooms.palaceId,
        title: rooms.title,
        position: rooms.position,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(palaces, eq(rooms.palaceId, palaces.id))
      .where(and(eq(palaces.userId, user.id), isNull(rooms.deletedAt), isNull(palaces.deletedAt)))
      .orderBy(asc(rooms.position), asc(rooms.createdAt)),

    db
      .select({
        id: nodes.id,
        roomId: nodes.roomId,
        title: nodes.title,
        content: nodes.content,
        nodeType: nodes.nodeType,
        positionX: nodes.positionX,
        positionY: nodes.positionY,
        color: nodes.color,
        createdAt: nodes.createdAt,
      })
      .from(nodes)
      .where(and(eq(nodes.userId, user.id), isNull(nodes.deletedAt)))
      .orderBy(asc(nodes.createdAt)),
  ]);

  // ── Build nested structure ─────────────────────────────────────────────────

  // Group nodes by roomId
  const nodesByRoomId = new Map<string, (typeof userNodes)[number][]>();
  for (const node of userNodes) {
    const existing = nodesByRoomId.get(node.roomId) ?? [];
    existing.push(node);
    nodesByRoomId.set(node.roomId, existing);
  }

  // Group rooms by palaceId
  const roomsByPalaceId = new Map<string, (typeof userRooms)[number][]>();
  for (const room of userRooms) {
    const existing = roomsByPalaceId.get(room.palaceId) ?? [];
    existing.push(room);
    roomsByPalaceId.set(room.palaceId, existing);
  }

  const exportedPalaces: ExportPalace[] = userPalaces.map((palace) => {
    const palaceRooms = roomsByPalaceId.get(palace.id) ?? [];

    const exportedRooms: ExportRoom[] = palaceRooms.map((room) => ({
      id: room.id,
      title: room.title,
      position: room.position,
      createdAt: room.createdAt.toISOString(),
      nodes: (nodesByRoomId.get(room.id) ?? []).map((node) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        nodeType: node.nodeType,
        positionX: node.positionX,
        positionY: node.positionY,
        color: node.color,
        createdAt: node.createdAt.toISOString(),
      })),
    }));

    return {
      id: palace.id,
      title: palace.title,
      description: palace.description,
      createdAt: palace.createdAt.toISOString(),
      rooms: exportedRooms,
    };
  });

  const exportPayload: ExportDataV1 = {
    version: '1',
    exportedAt: new Date().toISOString(),
    palaces: exportedPalaces,
  };

  // ── Stream JSON as a file download ─────────────────────────────────────────
  const dateSlug = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `memory-palace-export-${dateSlug}.json`;

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Prevent caches from serving stale exports belonging to another user.
      'Cache-Control': 'no-store',
    },
  });
}
