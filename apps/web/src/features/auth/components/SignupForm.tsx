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
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
        Check your email to confirm your account.
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
        autoComplete="email"
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background focus:outline-none focus:ring-2 focus:ring-zinc-500"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        minLength={6}
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background focus:outline-none focus:ring-2 focus:ring-zinc-500"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
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
