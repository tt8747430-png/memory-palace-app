'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert, Input, Label, PasswordInput } from '@/ui';
import { signIn } from '../actions/signIn';
import { initialAuthFormState } from '../actions/types';
import { AuthSubmitButton } from './AuthSubmitButton';
import { authInputClass, authLabelClass, authLinkClass, authMutedTextClass } from './authStyles';

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialAuthFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className={authLabelClass}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={authInputClass}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className={authLabelClass}>
            Password
          </Label>
          <Link
            href="/forgot-password"
            className={`text-sm ${authMutedTextClass} underline-offset-4 hover:underline`}
          >
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className={authInputClass}
        />
      </div>
      {state.status === 'error' ? (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      ) : null}
      <AuthSubmitButton idleLabel="Sign In" pendingLabel="Signing in…" />
      <p className={`text-center text-sm ${authMutedTextClass}`}>
        No account?{' '}
        <Link href="/signup" className={authLinkClass}>
          Sign up
        </Link>
      </p>
    </form>
  );
}
