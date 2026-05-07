'use client';

import { useActionState } from 'react';
import { Button, Input, Label } from '@memory-palace/ui';
import { createWizardAccount, type WizardAccountState } from '../../actions/createWizardAccount';

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
        <div className="text-5xl">📬</div>
        <h2 className="text-2xl font-bold">Check your inbox</h2>
        <p className="text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-sm text-muted-foreground">Free forever. No credit card required.</p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-email">Email</Label>
          <Input
            id="wizard-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wizard-password">Password</Label>
          <Input
            id="wizard-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={isPending}
          />
        </div>

        {state.status === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Creating account…' : 'Continue'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="underline underline-offset-4 hover:text-foreground">
          Log in
        </a>
      </p>
    </div>
  );
}
