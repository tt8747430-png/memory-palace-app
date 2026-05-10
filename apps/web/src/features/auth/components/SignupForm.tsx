'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert, Input, Label } from '@memory-palace/ui';
import { signUp } from '../actions/signUp';
import { initialAuthFormState } from '../actions/types';
import { AuthSubmitButton } from './AuthSubmitButton';
import { authInputClass, authLabelClass, authLinkClass, authMutedTextClass } from './authStyles';

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialAuthFormState);

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
        <Label htmlFor="signup-email" className={authLabelClass}>
          Email
        </Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={authInputClass}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className={authLabelClass}>
          Password
        </Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
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
      <AuthSubmitButton idleLabel="Create Account" pendingLabel="Creating account…" />
      <p className={`text-center text-sm ${authMutedTextClass}`}>
        Already have an account?{' '}
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
