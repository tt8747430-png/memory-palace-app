'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog';
import { deletePalace } from '../actions/deletePalace';

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
      description="This palace and all its rooms will be permanently deleted. This action cannot be undone."
      onConfirm={async () => {
        const result = await deletePalace({ id });
        if (!result.success) throw new Error(result.error.message);
      }}
    />
  );
}
