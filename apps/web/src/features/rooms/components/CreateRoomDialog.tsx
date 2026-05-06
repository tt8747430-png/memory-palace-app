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
  Alert,
} from '@memory-palace/ui';
import { createRoom } from '../actions/createRoom';

interface CreateRoomDialogProps {
  palaceId: string;
  nextPosition?: number;
  /** When true the dialog opens immediately (e.g. deep-linked via ?action=create-room). */
  autoOpen?: boolean;
}

export function CreateRoomDialog({
  palaceId,
  nextPosition = 0,
  autoOpen = false,
}: CreateRoomDialogProps) {
  const router = useRouter();
  // Derive open from autoOpen (prop-driven) or userOpen (button/close).
  const [userOpen, setUserOpen] = useState(false);
  const open = autoOpen || userOpen;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Strip the search param so a refresh doesn't reopen the dialog.
  useEffect(() => {
    if (autoOpen) {
      router.replace(`/palaces/${palaceId}`);
    }
  }, [autoOpen, palaceId, router]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const title = formData.get('title') as string;

    startTransition(async () => {
      const result = await createRoom({ palaceId, title, position: nextPosition });
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
          New Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Room</DialogTitle>
          <DialogDescription>
            Rooms are spaces inside your palace where you place memory nodes.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-title">Room Name</Label>
            <Input
              id="room-title"
              name="title"
              placeholder="e.g. The Library"
              required
              maxLength={100}
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
              {isPending ? 'Creating…' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
