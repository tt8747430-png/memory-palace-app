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
  Textarea,
  Alert,
} from '@/ui';
import { useAppDialog } from '@/shared/components/AppDialogContext';
import { createPalace } from '../actions/createPalace';

export function CreatePalaceDialog() {
  const { pending, open: openDialog, consume } = useAppDialog();
  const isOpen = pending === 'create-palace';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create-palace') {
      openDialog('create-palace');
      window.history.replaceState(null, '', '/palaces');
    }
  }, [openDialog]);

  function handleSubmit(formData: FormData) {
    setError(null);
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || undefined;

    startTransition(async () => {
      const result = await createPalace({ title, description });
      if (!result.success) {
        setError(result.error.message);
      } else {
        consume();
      }
    });
  }

  function handleOpenChange(next: boolean) {
    if (!isSubmitting) {
      if (next) openDialog('create-palace');
      else consume();
      setError(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="palace-description">Description (optional)</Label>
            <Textarea
              id="palace-description"
              name="description"
              placeholder="What will you remember here?"
              maxLength={500}
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
              {isSubmitting ? 'Creating…' : 'Create Palace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
