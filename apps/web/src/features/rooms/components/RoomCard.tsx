import type { ReactNode } from 'react';
import Link from 'next/link';
import { DoorOpen } from 'lucide-react';
import type { SelectRoom } from '@/db';
import { Card, CardHeader, CardTitle, CardFooter } from '@/ui';
import { EditRoomDialog } from './EditRoomDialog';
import { DeleteRoomButton } from './DeleteRoomButton';
import { DuplicateRoomButton } from './DuplicateRoomButton';

interface RoomCardProps {
  room: SelectRoom;

  reorderControls?: ReactNode;
}

export function RoomCard({ room, reorderControls }: RoomCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1 pb-3">
        <div className="flex items-center gap-2">
          {reorderControls}
          <DoorOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <CardTitle className="text-base">
            <Link
              href={`/palaces/${room.palaceId}/rooms/${room.id}`}
              className="hover:text-primary hover:underline underline-offset-4"
            >
              {room.title}
            </Link>
          </CardTitle>
        </div>
      </CardHeader>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <EditRoomDialog room={room} />
        <DuplicateRoomButton id={room.id} palaceId={room.palaceId} title={room.title} />
        <DeleteRoomButton id={room.id} palaceId={room.palaceId} title={room.title} />
      </CardFooter>
    </Card>
  );
}
