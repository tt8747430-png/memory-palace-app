'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/shared/lib/supabase-browser';
import { Button } from '@memory-palace/ui';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const supabase = createSupabaseBrowser();
      const emailRedirectTo = `${window.location.origin}/callback?next=/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        setStatus('Account created successfully. Redirecting to your dashboard…');
        router.push('/');
        router.refresh();
        return;
      }

      setStatus('Check your email to confirm your account.');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create your account right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (status && !loading && !error && status.startsWith('Check your email')) {
    return (
      <div
        role="status"
        className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        {status}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        autoComplete="email"
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background focus:outline-none focus:ring-2 focus:ring-zinc-500"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        autoComplete="new-password"
        minLength={6}
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background focus:outline-none focus:ring-2 focus:ring-zinc-500"
      />
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      {status && !status.startsWith('Check your email') ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {status}
        </p>
      ) : null}
      <Button type="submit" className="w-full min-h-[48px]" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <a href="/login" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Sign in
        </a>
      </p>
    </form>
  );
}
