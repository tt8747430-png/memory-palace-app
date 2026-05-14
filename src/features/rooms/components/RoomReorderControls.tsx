'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button, toast } from '@/ui';
import { setRoomOrder } from '@/features/rooms';

interface Props {
  palaceId: string;

  orderedIds: string[];

  index: number;
}

export function RoomReorderControls({ palaceId, orderedIds, index }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= orderedIds.length) return;
    const next = orderedIds.slice();
    [next[index], next[target]] = [next[target]!, next[index]!];
    startTransition(async () => {
      const result = await setRoomOrder({ palaceId, orderedIds: next });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => move(-1)}
        disabled={pending || index === 0}
        aria-label="Move room up"
        className="h-6 w-6 p-0"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronUp className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => move(1)}
        disabled={pending || index === orderedIds.length - 1}
        aria-label="Move room down"
        className="h-6 w-6 p-0"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
