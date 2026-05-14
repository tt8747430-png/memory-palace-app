'use client';

import { useActionState } from 'react';
import { Button, Input, Label } from '@/ui';
import { createWizardSetup } from '../../actions/createWizardSetup';
import type { ActionResponse } from '@/shared/types';
import type { WizardSetupResult } from '../../actions/createWizardSetup';
import {
  onboardingInputClass,
  onboardingLabelClass,
  onboardingMutedTextClass,
  onboardingSubmitButtonClass,
} from '../onboardingStyles';

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
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-3xl font-normal tracking-[-1px] text-white md:text-4xl">
          Name your palace.
        </h2>
        <p className={`text-sm ${onboardingMutedTextClass}`}>
          Think of a subject or topic you want to master.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="palace-name" className={onboardingLabelClass}>
            Palace name
          </Label>
          <Input
            id="palace-name"
            name="name"
            type="text"
            placeholder="e.g. World History"
            maxLength={100}
            required
            disabled={isPending}
            className={onboardingInputClass}
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
              className="liquid-glass rounded-full px-3 py-1 font-body text-xs text-white/80 transition-transform hover:scale-[1.03] hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>

        {state && !state.success && (
          <p role="alert" className="text-sm text-rose-300">
            {state.error.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className={onboardingSubmitButtonClass}>
          {isPending ? 'Creating…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
