import { cache } from 'react';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, DoorOpen } from 'lucide-react';
import { getPalaceById, CreatePalaceDialog } from '@/features/palaces';
import { getRooms, RoomCard, CreateRoomDialog } from '@/features/rooms';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/CardSkeleton';

// cache() deduplicates calls with the same palaceId within a single request,
// so generateMetadata and RoomGrid share one DB round-trip, not two.
const getCachedPalace = cache((palaceId: string) => getPalaceById({ id: palaceId }));

interface PalacePageProps {
  params: Promise<{ palaceId: string }>;
}

export async function generateMetadata({ params }: PalacePageProps) {
  const { palaceId } = await params;
  const result = await getCachedPalace(palaceId);
  return {
    title: result.success ? `${result.data.title} — Memory Palace` : 'Palace — Memory Palace',
  };
}

async function RoomGrid({ palaceId }: { palaceId: string }) {
  const [palaceResult, roomsResult] = await Promise.all([
    getCachedPalace(palaceId),
    getRooms({ palaceId }),
  ]);

  if (!palaceResult.success) notFound();

  const palace = palaceResult.data;
  const rooms = roomsResult.success ? roomsResult.data : [];
  const nextPosition = rooms.length;

  return (
    <>
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/palaces" className="hover:text-foreground">
          Palaces
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{palace.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{palace.title}</h1>
          {palace.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{palace.description}</p>
          ) : null}
        </div>
        <CreatePalaceDialog />
      </div>

      {/* Rooms */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Rooms ({rooms.length})
          </h2>
          <CreateRoomDialog palaceId={palaceId} nextPosition={nextPosition} />
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={<DoorOpen />}
            title="No rooms yet"
            description="Add rooms to this palace to organise your memory nodes."
            headingLevel={3}
            action={<CreateRoomDialog palaceId={palaceId} nextPosition={0} />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default async function PalaceDetailPage({ params }: PalacePageProps) {
  const { palaceId } = await params;
  return (
    <div className="space-y-6">
      <Suspense fallback={<CardSkeleton count={3} />}>
        <RoomGrid palaceId={palaceId} />
      </Suspense>
    </div>
  );
}
