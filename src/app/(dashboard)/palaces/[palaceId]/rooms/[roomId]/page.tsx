import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Footprints } from 'lucide-react';
import { getPalaceById } from '@/features/palaces';
import { getRoomById } from '@/features/rooms';
import { getRoomNodes } from '@/features/nodes';
import { RoomCanvas, CanvasErrorBoundary } from '@/features/spatial-canvas';

const getCachedPalace = cache((palaceId: string) => getPalaceById({ id: palaceId }));
const getCachedRoom = cache((roomId: string, palaceId: string) =>
  getRoomById({ id: roomId, palaceId }),
);

interface RoomPageProps {
  params: Promise<{ palaceId: string; roomId: string }>;
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { palaceId, roomId } = await params;
  const result = await getCachedRoom(roomId, palaceId);
  return {
    title: result.success ? result.data.title : 'Room',
    description: result.success ? `Memory canvas for "${result.data.title}".` : undefined,
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { palaceId, roomId } = await params;

  const [palaceResult, roomResult, nodesResult] = await Promise.all([
    getCachedPalace(palaceId),
    getCachedRoom(roomId, palaceId),
    getRoomNodes({ roomId }),
  ]);

  if (!palaceResult.success || !roomResult.success) notFound();

  const palace = palaceResult.data;
  const room = roomResult.data;
  const initialNodes = nodesResult.success ? nodesResult.data : [];

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem-3rem-var(--height-bottom-nav)-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col sm:-mx-6 md:h-dvh lg:-mx-8">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-backdrop-filter:bg-background/75 sm:px-6 lg:px-8">
        <nav
          className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/palaces" className="hover:text-foreground">
            Palaces
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href={`/palaces/${palaceId}`} className="truncate hover:text-foreground">
            {palace.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <h1 className="truncate font-semibold text-foreground">{room.title}</h1>
        </nav>
        {initialNodes.length > 0 ? (
          <Link
            href={`/palaces/${palaceId}/rooms/${roomId}/journey`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Footprints className="h-4 w-4" /> Start journey
          </Link>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        <CanvasErrorBoundary>
          <RoomCanvas roomId={roomId} initialNodes={initialNodes} palaceMode={palace.mode} />
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}
