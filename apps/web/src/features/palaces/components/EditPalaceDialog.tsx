'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import type { PalaceMode, SelectPalace } from '@/db';
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
  cn,
} from '@memory-palace/ui';
import { updatePalace } from '../actions/updatePalace';

interface EditPalaceDialogProps {
  palace: SelectPalace;
}

export function EditPalaceDialog({ palace }: EditPalaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<PalaceMode>(palace.mode);

  function handleSubmit(formData: FormData) {
    setError(null);
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || null;

    startTransition(async () => {
      const result = await updatePalace({ id: palace.id, title, description, mode });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setOpen(false);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    if (!isPending) {
      setOpen(next);
      setError(null);
      if (next) setMode(palace.mode);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Edit ${palace.title}`} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Palace</DialogTitle>
          <DialogDescription>
            Update the title, description, or mode of this palace.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-palace-title">Title</Label>
            <Input
              id="edit-palace-title"
              name="title"
              defaultValue={palace.title}
              required
              maxLength={100}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-palace-description">Description (optional)</Label>
            <Textarea
              id="edit-palace-description"
              name="description"
              defaultValue={palace.description ?? ''}
              maxLength={500}
              disabled={isPending}
            />
          </div>
          <fieldset className="space-y-1.5" disabled={isPending}>
            <legend className="text-sm font-medium">Mode</legend>
            <div role="radiogroup" aria-label="Palace mode" className="flex gap-2">
              {(['bible', 'simple'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors',
                    mode === m
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted',
                  )}
                >
                  {m === 'bible' ? 'Bible (chapters & verses)' : 'Simple'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Bible mode labels rooms as chapters, nodes as verses, and unlocks the verse-hint field
              on each node.
            </p>
          </fieldset>
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
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
