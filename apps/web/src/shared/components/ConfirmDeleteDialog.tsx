'use client';

import { useState, useTransition } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@memory-palace/ui';

interface ConfirmDeleteDialogProps {
  /** The trigger element (e.g. a delete button). */
  trigger: React.ReactNode;
  /** Short title shown in the dialog heading, e.g. "Delete Palace". */
  title: string;
  /** Longer description of what will be destroyed. */
  description: string;
  /** Called when the user confirms. Can be async. */
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            aria-label="Confirm delete"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
