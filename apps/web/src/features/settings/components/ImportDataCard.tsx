'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@memory-palace/ui';
import { importPalaceData } from '../actions/importPalaceData';
import type { ImportStats } from '../actions/importPalaceData';

type ImportState =
  | { status: 'idle' }
  | { status: 'success'; stats: ImportStats }
  | { status: 'error'; message: string };

/**
 * Renders a file input that accepts `.json` exports and calls the
 * importPalaceData server action. React 19's useTransition drives the
 * pending state so the submit button disables automatically.
 */
export function ImportDataCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size guard — mirrors the 10 MB Zod limit to give immediate
    // feedback before the round-trip.
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
          // Clear the file input so the same file can be re-selected after
          // a page refresh or a second import attempt.
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
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>
          Restore from a previously exported JSON file. Existing palaces with matching IDs are
          skipped — importing the same file twice is safe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="gap-2"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {isPending ? 'Importing…' : 'Choose File'}
          </Button>
          {/* Hidden file input — triggered via the button above for consistent styling. */}
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
      </CardContent>
    </Card>
  );
}
