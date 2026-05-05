'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Input, Label } from '@memory-palace/ui';
import { signIn } from '../actions/signIn';
import { initialAuthFormState } from '../actions/types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign In'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialAuthFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      {state.status === 'error' ? (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      ) : null}
      <SubmitButton />
      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
