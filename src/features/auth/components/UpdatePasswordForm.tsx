'use client';

import { useActionState } from 'react';
import { Alert, Label, PasswordInput } from '@/ui';
import { updatePassword } from '../actions/updatePassword';
import { initialAuthFormState } from '../actions/types';
import { AuthSubmitButton } from './AuthSubmitButton';
import { authInputClass, authLabelClass } from './authStyles';

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialAuthFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className={authLabelClass}>
          New password
        </Label>
        <PasswordInput
          id="new-password"
          name="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={8}
          className={authInputClass}
        />
        <p className="text-xs text-white/50">Requires at least 8 characters.</p>
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
