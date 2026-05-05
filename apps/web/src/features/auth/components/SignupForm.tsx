'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Input, Label } from '@memory-palace/ui';
import { signUp } from '../actions/signUp';
import { initialAuthFormState } from '../actions/types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Create Account'}
    </Button>
  );
}

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
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={6}
        />
      </div>
      {state.status === 'error' ? (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      ) : null}
      <SubmitButton />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
