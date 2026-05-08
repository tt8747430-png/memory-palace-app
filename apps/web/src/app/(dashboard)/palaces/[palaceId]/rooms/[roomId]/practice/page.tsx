import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@memory-palace/ui';
import { getPalaceById } from '@/features/palaces';
import { getRoomById } from '@/features/rooms';
import { getDueNodes, PracticePicker } from '@/features/practice';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ palaceId: string; roomId: string }>;
}) {
  const { roomId } = await params;
  const result = await getRoomById({ id: roomId });
  const title = result.success ? result.data.title : 'Practice';
  return { title: `Practice — ${title}` };
}

interface PageProps {
  params: Promise<{ palaceId: string; roomId: string }>;
}

export default async function RoomPracticePage({ params }: PageProps) {
  const { palaceId, roomId } = await params;

  const [palaceResult, roomResult] = await Promise.all([
    getPalaceById({ id: palaceId }),
    getRoomById({ id: roomId, palaceId }),
  ]);

  if (!palaceResult.success || !roomResult.success) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/palaces/${palaceId}/rooms/${roomId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to room
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {palaceResult.data.title}
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{roomResult.data.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice every node in this room. Items already in your spaced-repetition queue jump to
          the top.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <RoomQueue roomId={roomId} />
      </Suspense>
    </div>
  );
}

async function RoomQueue({ roomId }: { roomId: string }) {
  const result = await getDueNodes({ roomId, limit: 100 });
  const due = result.success ? result.data : [];
  return <PracticePicker due={due} />;
}
