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

export async function generateMetadata({ params }: RoomPageProps) {
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
    <div className="flex h-full flex-col gap-3">
      {/*
       * Minimal canvas chrome — single compact bar that gives the canvas
       * maximum vertical room. Breadcrumb on the left identifies the
       * palace/room; "Start journey" lives on the right when there's
       * something to walk through. The room title is no longer duplicated
       * as an h1 because the breadcrumb already terminates in it (and
       * <title> covers the document head).
       */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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

      {/* Spatial canvas — error boundary ensures sidebar survives a crash.
       * Uses dynamic viewport height (`dvh`) so iOS Safari URL-bar collapse
       * doesn't leave the canvas with a stale fixed pixel height. The 10rem
       * subtracted accounts for the dashboard chrome + this page's compact
       * single-bar header (was 16rem with the full h1 stack).
       * The inner `RoomCanvas` registers a ResizeObserver to refit viewport
       * on container size changes (rotation, browser-chrome show/hide). */}
      <div className="h-[calc(100dvh-10rem)] min-h-[420px] w-full">
        <CanvasErrorBoundary>
          <RoomCanvas roomId={roomId} initialNodes={initialNodes} palaceMode={palace.mode} />
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}
