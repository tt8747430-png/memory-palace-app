'use client';

import { useActionState } from 'react';
import { Button, Input, Label, PasswordInput } from '@memory-palace/ui';
import { createWizardAccount, type WizardAccountState } from '../../actions/createWizardAccount';
import {
  onboardingInputClass,
  onboardingLabelClass,
  onboardingLinkClass,
  onboardingMutedTextClass,
  onboardingSubmitButtonClass,
} from '../onboardingStyles';

interface StepCreateAccountProps {
  onSuccess: () => void;
}

const INITIAL: WizardAccountState = { status: 'idle' };

export function StepCreateAccount({ onSuccess }: StepCreateAccountProps) {
  const [state, action, isPending] = useActionState(
    async (prev: WizardAccountState, formData: FormData) => {
      const result = await createWizardAccount(prev, formData);
      if (result.status === 'ok') onSuccess();
      return result;
    },
    INITIAL,
  );

  if (state.status === 'check-email') {
    return (
      <div className="space-y-4 text-center">
        <h2 className="font-heading text-3xl font-normal tracking-[-1px] text-white md:text-4xl">
          Check your inbox.
        </h2>
        <p className={onboardingMutedTextClass}>{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-3xl font-normal tracking-[-1px] text-white md:text-4xl">
          Create your account.
        </h2>
        <p className={`text-sm ${onboardingMutedTextClass}`}>
          Free forever. No credit card required.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-email" className={onboardingLabelClass}>
            Email
          </Label>
          <Input
            id="wizard-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
            className={onboardingInputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wizard-password" className={onboardingLabelClass}>
            Password
          </Label>
          <PasswordInput
            id="wizard-password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={isPending}
            className={onboardingInputClass}
          />
        </div>

        {state.status === 'error' && (
          <p role="alert" className="text-sm text-rose-300">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className={onboardingSubmitButtonClass}>
          {isPending ? 'Creating account…' : 'Continue'}
        </Button>
      </form>

      <p className={`text-center text-xs ${onboardingMutedTextClass}`}>
        Already have an account?{' '}
        <a href="/login" className={onboardingLinkClass}>
          Log in
        </a>
      </p>
    </div>
  );
}
