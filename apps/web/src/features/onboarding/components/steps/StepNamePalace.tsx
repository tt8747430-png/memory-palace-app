'use client';

import { useActionState } from 'react';
import { Button, Input, Label } from '@memory-palace/ui';
import { createWizardSetup } from '../../actions/createWizardSetup';
import type { ActionResponse } from '@/shared/types';
import type { WizardSetupResult } from '../../actions/createWizardSetup';

const SUGGESTIONS = ['My Study Palace', 'History Palace', 'Science Lab', 'Language House'];

interface StepNamePalaceProps {
  onSuccess: (palaceId: string, roomId: string) => void;
}

export function StepNamePalace({ onSuccess }: StepNamePalaceProps) {
  const [state, action, isPending] = useActionState(
    async (_prev: ActionResponse<WizardSetupResult> | null, formData: FormData) => {
      const result = await createWizardSetup({ name: formData.get('name') as string });
      if (result.success) onSuccess(result.data.palaceId, result.data.roomId);
      return result;
    },
    null,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <div className="mb-2 text-4xl">🏛️</div>
        <h2 className="text-2xl font-bold">Name your palace</h2>
        <p className="text-sm text-muted-foreground">
          Think of a subject or topic you want to master.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="palace-name">Palace name</Label>
          <Input
            id="palace-name"
            name="name"
            type="text"
            placeholder="e.g. World History"
            maxLength={100}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                const input = (
                  e.currentTarget.closest('form') as HTMLFormElement
                )?.elements.namedItem('name') as HTMLInputElement | null;
                if (input) input.value = s;
              }}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {state && !state.success && (
          <p role="alert" className="text-sm text-destructive">
            {state.error.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Creating…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
