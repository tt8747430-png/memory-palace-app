'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Alert,
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

/**
 * iOS-style centered destructive confirm.
 *
 * Layout: glyph circle on top → bold title → muted description → stacked
 * buttons (full-width on mobile, side-by-side on >= sm). Destructive
 * action uses the `destructive` variant so it picks up `--destructive`
 * from the theme; `Cancel` uses `outline` and is the default focus
 * target via tab order so accidental Enter doesn't delete.
 */
export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (!isPending) {
      setOpen(next);
      if (!next) setError(null);
    }
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
        setOpen(false);
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl p-6 text-center sm:p-7">
        <DialogHeader className="items-center text-center sm:text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20"
          >
            <Trash2 className="h-6 w-6" strokeWidth={2} />
          </div>
          <DialogTitle className="text-center text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive" role="alert" className="mt-2">
            {error}
          </Alert>
        ) : null}
        <DialogFooter className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-stretch">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="w-full sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            aria-label="Confirm delete"
            className="w-full sm:flex-1"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
