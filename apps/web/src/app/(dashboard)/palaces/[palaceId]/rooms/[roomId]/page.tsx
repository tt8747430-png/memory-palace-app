import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, BrainCircuit } from 'lucide-react';
import { getPalaceById } from '@/features/palaces';
import { getRoomById } from '@/features/rooms';

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

  const [palaceResult, roomResult] = await Promise.all([
    getPalaceById({ id: palaceId }),
    getRoomById({ id: roomId, palaceId }),
  ]);

  if (!palaceResult.success || !roomResult.success) notFound();

  const palace = palaceResult.data;
  const room = roomResult.data;

  return (
    <div className="space-y-6">
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

      {/* Canvas placeholder — Phase 5 will replace this */}
      <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10">
        <BrainCircuit className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Spatial Canvas</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Coming in Phase 5</p>
      </div>
    </div>
  );
}
