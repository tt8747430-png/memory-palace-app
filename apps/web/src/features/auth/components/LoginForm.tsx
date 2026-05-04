'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Input } from '@memory-palace/ui';
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
      <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        required
        autoComplete="current-password"
      />
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
