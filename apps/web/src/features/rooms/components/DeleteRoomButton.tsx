'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { deleteRoom } from '../actions/deleteRoom';

interface DeleteRoomButtonProps {
  id: string;
  palaceId: string;
  title: string;
}

export function DeleteRoomButton({ id, palaceId, title }: DeleteRoomButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete room "${title}"? All nodes inside will be permanently removed.`)) return;
    startTransition(async () => {
      await deleteRoom({ id, palaceId });
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={`Delete ${title}`}
      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
