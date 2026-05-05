'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog';
import { deleteRoom } from '../actions/deleteRoom';

interface DeleteRoomButtonProps {
  id: string;
  palaceId: string;
  title: string;
}

export function DeleteRoomButton({ id, palaceId, title }: DeleteRoomButtonProps) {
  return (
    <ConfirmDeleteDialog
      trigger={
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${title}`}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      }
      title={`Delete "${title}"?`}
      description="All nodes inside this room will be permanently removed. This action cannot be undone."
      onConfirm={async () => {
        await deleteRoom({ id, palaceId });
      }}
    />
  );
}
