'use client';

import { Trash2 } from 'lucide-react';
import { Button, toast } from '@memory-palace/ui';
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog';
import { deletePalace } from '../actions/deletePalace';
import { restorePalace } from '../actions/restorePalace';

interface DeletePalaceButtonProps {
  id: string;
  title: string;
}

export function DeletePalaceButton({ id, title }: DeletePalaceButtonProps) {
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
      description="This palace and all its rooms will be moved to the trash. You can undo within 30 seconds."
      onConfirm={async () => {
        const result = await deletePalace({ id });
        if (!result.success) throw new Error(result.error.message);
        const { undoToken } = result.data;
        toast.success(`Deleted "${title}"`, {
          duration: 30_000,
          action: {
            label: 'Undo',
            onClick: async () => {
              const restored = await restorePalace({ undoToken });
              if (!restored.success) {
                toast.error(restored.error.message);
                return;
              }
              toast.success(`Restored "${title}"`);
            },
          },
        });
      }}
    />
  );
}
