'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert, Input, Label } from '@memory-palace/ui';
import { requestPasswordReset } from '../actions/requestPasswordReset';
import { initialAuthFormState } from '../actions/types';
import { AuthSubmitButton } from './AuthSubmitButton';
import { authInputClass, authLabelClass, authLinkClass, authMutedTextClass } from './authStyles';

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialAuthFormState);

  if (state.status === 'check-email') {
    return (
      <Alert variant="success" role="status">
        {state.message}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email" className={authLabelClass}>
          Email
        </Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={authInputClass}
        />
      </div>
      {state.status === 'error' ? (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      ) : null}
      <AuthSubmitButton idleLabel="Send reset link" pendingLabel="Sending…" />
      <p className={`text-center text-sm ${authMutedTextClass}`}>
        Remembered it?{' '}
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
