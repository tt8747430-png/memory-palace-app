import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getPalaceById } from '@/features/palaces';
import { getRoomById } from '@/features/rooms';
import { getRoomNodes } from '@/features/nodes';
import { RoomCanvas, CanvasErrorBoundary } from '@/features/spatial-canvas';

interface RoomPageProps {
  params: Promise<{ palaceId: string; roomId: string }>;
}

export async function generateMetadata({ params }: RoomPageProps) {
  const { palaceId, roomId } = await params;
  const result = await getRoomById({ id: roomId, palaceId });
  return {
    title: result.success ? `${result.data.title} — Memory Palace` : 'Room — Memory Palace',
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { palaceId, roomId } = await params;

  const [palaceResult, roomResult, nodesResult] = await Promise.all([
    getPalaceById({ id: palaceId }),
    getRoomById({ id: roomId, palaceId }),
    getRoomNodes({ roomId }),
  ]);

  if (!palaceResult.success || !roomResult.success) notFound();

  const palace = palaceResult.data;
  const room = roomResult.data;
  const initialNodes = nodesResult.success ? nodesResult.data : [];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/palaces" className="hover:text-foreground">
          Palaces
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/palaces/${palaceId}`} className="hover:text-foreground">
          {palace.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{room.title}</span>
      </nav>

      {/* Room header */}
      <div>
        <h1 className="text-2xl font-bold">{room.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Room in <span className="font-medium text-foreground">{palace.title}</span>
        </p>
      </div>

      {/* Spatial canvas — error boundary ensures sidebar survives a crash.
       * Needs an explicit height (not min-height) so React Flow's `h-full`
       * child resolves; the parent layout chain doesn't propagate height. */}
      <div className="h-[500px] md:h-[700px]">
        <CanvasErrorBoundary>
          <RoomCanvas roomId={roomId} initialNodes={initialNodes} />
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}
