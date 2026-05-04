'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, Input } from '@memory-palace/ui';
import { signIn } from '../actions/signIn';
import { initialAuthFormState } from '../actions/types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full min-h-[48px]" disabled={pending}>
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
        <p role="alert" className="text-sm text-red-500">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-center text-sm text-zinc-500">
        No account?{' '}
        <Link href="/signup" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Sign up
        </Link>
      </p>
    </form>
  );
}
