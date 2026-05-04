'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@memory-palace/ui';
import { signUp } from '../actions/signUp';
import { initialAuthFormState } from '../actions/types';

const inputClass =
  'w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background focus:outline-none focus:ring-2 focus:ring-zinc-500';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full min-h-[48px]" disabled={pending}>
      {pending ? 'Creating account…' : 'Create Account'}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialAuthFormState);

  if (state.status === 'check-email') {
    return (
      <div
        role="status"
        className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        autoComplete="new-password"
        minLength={6}
        className={inputClass}
      />
      {state.status === 'error' ? (
        <p role="alert" className="text-sm text-red-500">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <a href="/login" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Sign in
        </a>
      </p>
    </form>
  );
}
