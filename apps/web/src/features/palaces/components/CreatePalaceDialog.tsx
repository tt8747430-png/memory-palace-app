'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Input,
  Label,
  Textarea,
  Alert,
} from '@memory-palace/ui';
import { createPalace } from '../actions/createPalace';

interface CreatePalaceDialogProps {
  /** When true the dialog opens immediately (e.g. deep-linked via ?action=create). */
  autoOpen?: boolean;
}

export function CreatePalaceDialog({ autoOpen = false }: CreatePalaceDialogProps) {
  const router = useRouter();
  // Derive open from autoOpen (prop-driven) or userOpen (button/close).
  // autoOpen handles both the initial-mount and already-mounted cases without
  // needing a synchronous setState inside an effect.
  const [userOpen, setUserOpen] = useState(false);
  const open = autoOpen || userOpen;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Strip the search param so a refresh doesn't reopen the dialog.
  useEffect(() => {
    if (autoOpen) {
      router.replace('/palaces');
    }
  }, [autoOpen, router]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || undefined;

    startTransition(async () => {
      const result = await createPalace({ title, description });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setUserOpen(false);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    if (!isPending) {
      setUserOpen(next);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="md" className="gap-2">
          <Plus className="h-4 w-4" />
          New Palace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Palace</DialogTitle>
          <DialogDescription>
            Give your Memory Palace a name and an optional description.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="palace-title">Title</Label>
            <Input
              id="palace-title"
              name="title"
              placeholder="e.g. Ancient Rome"
              required
              maxLength={100}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="palace-description">Description (optional)</Label>
            <Textarea
              id="palace-description"
              name="description"
              placeholder="What will you remember here?"
              maxLength={500}
              disabled={isPending}
            />
          </div>
          {error ? (
            <Alert variant="destructive" role="alert">
              {error}
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="md" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Palace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
