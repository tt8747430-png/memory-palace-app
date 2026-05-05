'use client';

import { useActionState } from 'react';
import { Alert, Input, Label } from '@memory-palace/ui';
import { updatePassword } from '../actions/updatePassword';
import { initialAuthFormState } from '../actions/types';
import { AuthSubmitButton } from './AuthSubmitButton';

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialAuthFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>
      {state.status === 'error' ? (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      ) : null}
      <AuthSubmitButton idleLabel="Save new password" pendingLabel="Saving…" />
    </form>
  );
}
