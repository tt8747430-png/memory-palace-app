import Link from 'next/link';
import { DoorOpen } from 'lucide-react';
import type { SelectRoom } from '@memory-palace/db';
import { Card, CardHeader, CardTitle, CardFooter } from '@memory-palace/ui';
import { EditRoomDialog } from './EditRoomDialog';
import { DeleteRoomButton } from './DeleteRoomButton';

interface RoomCardProps {
  room: SelectRoom;
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1 pb-3">
        <div className="flex items-center gap-2">
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
      <CardFooter className="gap-2 pt-0">
        <EditRoomDialog room={room} />
        <DeleteRoomButton id={room.id} palaceId={room.palaceId} title={room.title} />
      </CardFooter>
    </Card>
  );
}
