import { cache, Suspense } from 'react';
import { notFound } from 'next/navigation';
import { DoorOpen } from 'lucide-react';
import {
  getPalaceById,
  getPalaceMeta,
  getPalaceRecentActivity,
  PalaceDetailHeader,
  PalaceMetaPanel,
} from '@/features/palaces';
import { getRooms, RoomCard, CreateRoomDialog, RoomReorderControls } from '@/features/rooms';
import { ActivityFeedPanel, sortByRecency, type ActivityEvent } from '@/features/dashboard';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/CardSkeleton';
import { EmptyStateCreateButton } from '@/shared/components/EmptyStateCreateButton';
import { MobileCreateFab } from '@/shared/components/MobileCreateFab';
import { Skeleton } from '@memory-palace/ui';

const getCachedPalace = cache((palaceId: string) => getPalaceById({ id: palaceId }));

interface PalacePageProps {
  params: Promise<{ palaceId: string }>;
}

export async function generateMetadata({ params }: PalacePageProps) {
  const { palaceId } = await params;
  const result = await getCachedPalace(palaceId);
  return {
    title: result.success ? result.data.title : 'Palace',
    description: result.success ? `Rooms in the "${result.data.title}" memory palace.` : undefined,
  };
}

async function PalaceDetail({ palaceId }: { palaceId: string }) {
  const [palaceResult, roomsResult, metaResult, activityResult] = await Promise.all([
    getCachedPalace(palaceId),
    getRooms({ palaceId }),
    getPalaceMeta({ id: palaceId }),
    getPalaceRecentActivity({ id: palaceId }),
  ]);

  if (!palaceResult.success) notFound();
  const palace = palaceResult.data;
  const rooms = roomsResult.success ? roomsResult.data : [];
  const meta = metaResult.success
    ? metaResult.data
    : { roomCount: rooms.length, nodeCount: 0, lastPracticedAt: null, masteredCount: 0 };
  const events: ActivityEvent[] = activityResult.success
    ? sortByRecency(
        activityResult.data.map<ActivityEvent>((row) => ({
          kind: 'practice',
          id: row.id,
          at: row.practicedAt,
          nodeTitle: row.nodeTitle,
          roomTitle: row.roomTitle,
          mode: row.mode,
          correct: row.correct,
          score: row.score,
        })),
      )
    : [];
  const nextPosition = rooms.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PalaceDetailHeader
        palace={palace}
        primaryAction={<CreateRoomDialog palaceId={palaceId} nextPosition={nextPosition} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="rooms-heading">
            <h2
              id="rooms-heading"
              className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Rooms ({rooms.length})
            </h2>
            {rooms.length === 0 ? (
              <EmptyState
                icon={<DoorOpen />}
                title="No rooms yet"
                description="Add rooms to this palace to organise your memory nodes."
                headingLevel={3}
                action={
                  <EmptyStateCreateButton dialogId="create-room">
                    Add your first room
                  </EmptyStateCreateButton>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room, i) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    reorderControls={
                      rooms.length > 1 ? (
                        <RoomReorderControls
                          palaceId={palaceId}
                          orderedIds={rooms.map((r) => r.id)}
                          index={i}
                        />
                      ) : null
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <ActivityFeedPanel
            events={events}
            title="Recent practice in this palace"
            emptyMessage="No practice activity in this palace yet."
          />
        </div>

        <aside className="space-y-6">
          <PalaceMetaPanel meta={meta} createdAt={palace.createdAt} updatedAt={palace.updatedAt} />
        </aside>
      </div>

      <MobileCreateFab dialogId="create-room" label="Add room" />
    </div>
  );
}

function PalaceDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CardSkeleton count={3} />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default async function PalaceDetailPage({ params }: PalacePageProps) {
  const { palaceId } = await params;
  return (
    <Suspense fallback={<PalaceDetailSkeleton />}>
      <PalaceDetail palaceId={palaceId} />
    </Suspense>
  );
}
