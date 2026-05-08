import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getPalaceById } from '@/features/palaces';
import { getRoomById } from '@/features/rooms';
import { getRoomNodes } from '@/features/nodes';
import { RoomJourney } from '@/features/rooms/components/RoomJourney';

const getCachedPalace = cache((palaceId: string) => getPalaceById({ id: palaceId }));
const getCachedRoom = cache((roomId: string, palaceId: string) =>
  getRoomById({ id: roomId, palaceId }),
);

interface JourneyPageProps {
  params: Promise<{ palaceId: string; roomId: string }>;
}

export async function generateMetadata({ params }: JourneyPageProps) {
  const { palaceId, roomId } = await params;
  const result = await getCachedRoom(roomId, palaceId);
  return {
    title: result.success ? `${result.data.title} · Journey` : 'Journey',
  };
}

export default async function RoomJourneyPage({ params }: JourneyPageProps) {
  const { palaceId, roomId } = await params;

  const [palaceResult, roomResult, nodesResult] = await Promise.all([
    getCachedPalace(palaceId),
    getCachedRoom(roomId, palaceId),
    getRoomNodes({ roomId }),
  ]);

  if (!palaceResult.success || !roomResult.success) notFound();

  const allNodes = nodesResult.success ? nodesResult.data : [];
  // Walk order: top-to-bottom, left-to-right by canvas position. The viewer
  // works on a stable snapshot — node moves while reading don't reorder.
  const journeyNodes = allNodes
    .slice()
    .sort((a, b) => a.positionY - b.positionY || a.positionX - b.positionX)
    .map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      color: n.color,
      verseHint: n.verseHint ?? null,
      bibleRef: n.bibleRef ?? null,
    }));

  return (
    <RoomJourney
      palaceId={palaceId}
      roomId={roomId}
      palaceTitle={palaceResult.data.title}
      roomTitle={roomResult.data.title}
      mode={palaceResult.data.mode}
      nodes={journeyNodes}
    />
  );
}
