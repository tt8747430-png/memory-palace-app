'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { deletePalace } from '../actions/deletePalace';

interface DeletePalaceButtonProps {
  id: string;
  title: string;
}

export function DeletePalaceButton({ id, title }: DeletePalaceButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deletePalace({ id });
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
