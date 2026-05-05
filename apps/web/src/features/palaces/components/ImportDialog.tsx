'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload } from 'lucide-react';
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
import { importPalaceData } from '../actions/importPalaceData';
import type { ImportStats } from '../actions/importPalaceData';

type ImportState =
  | { status: 'idle' }
  | { status: 'success'; stats: ImportStats }
  | { status: 'error'; message: string };

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ImportState>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleOpenChange(next: boolean) {
    if (!isPending) {
      setOpen(next);
      if (!next) {
        setState({ status: 'idle' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size guard — mirrors the 10 MB Zod limit for instant feedback.
    if (file.size > 10 * 1024 * 1024) {
      setState({ status: 'error', message: 'File must be 10 MB or smaller.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonContent = event.target?.result as string;
      startTransition(async () => {
        setState({ status: 'idle' });
        const result = await importPalaceData({ jsonContent });
        if (!result.success) {
          setState({ status: 'error', message: result.error.message });
        } else {
          setState({ status: 'success', stats: result.data });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    };
    reader.onerror = () => {
      setState({ status: 'error', message: 'Failed to read the file.' });
    };
    reader.readAsText(file);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Palaces</DialogTitle>
          <DialogDescription>
            Restore from a previously exported JSON file. Existing palaces with matching IDs are
            skipped — importing the same file twice is safe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {isPending ? 'Importing…' : 'Choose File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              aria-label="Import export file"
              className="sr-only"
              disabled={isPending}
              onChange={handleFileChange}
            />
          </div>

          {state.status === 'error' && (
            <Alert variant="destructive" role="alert">
              {state.message}
            </Alert>
          )}

          {state.status === 'success' && (
            <Alert role="status">
              Import complete — {state.stats.palaces} palace
              {state.stats.palaces !== 1 ? 's' : ''}, {state.stats.rooms} room
              {state.stats.rooms !== 1 ? 's' : ''}, {state.stats.nodes} node
              {state.stats.nodes !== 1 ? 's' : ''} added.
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {state.status === 'success' ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
