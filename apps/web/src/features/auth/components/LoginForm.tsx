'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/shared/lib/supabase-browser';
import { Button } from '@memory-palace/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        return;
      }

      setStatus('Signed in successfully. Redirecting to your dashboard…');
      router.push('/');
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to sign in right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
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
        autoComplete="current-password"
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background focus:outline-none focus:ring-2 focus:ring-zinc-500"
      />
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {status}
        </p>
      ) : null}
      <Button type="submit" className="w-full min-h-[48px]" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        No account?{' '}
        <a href="/signup" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Sign up
        </a>
      </p>
    </form>
  );
}
