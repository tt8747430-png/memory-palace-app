'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
} from '@/ui';
import { useAppDialog } from '@/shared/components/AppDialogContext';
import { createRoom } from '@/features/rooms';

interface CreateRoomDialogProps {
  palaceId: string;
  nextPosition?: number;
}

export function CreateRoomDialog({ palaceId, nextPosition = 0 }: CreateRoomDialogProps) {
  const { pending, open: openDialog, consume } = useAppDialog();
  const isOpen = pending === 'create-room';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create-room') {
      openDialog('create-room');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [openDialog]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const title = formData.get('title') as string;

    startTransition(async () => {
      const result = await createRoom({ palaceId, title, position: nextPosition });
      if (!result.success) {
        setError(result.error.message);
      } else {
        consume();
      }
    });
  }

  function handleOpenChange(next: boolean) {
    if (!isSubmitting) {
      if (next) openDialog('create-room');
      else consume();
      setError(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
              disabled={isSubmitting}
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
              onClick={() => {
                if (!isSubmitting) {
                  consume();
                  setError(null);
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
