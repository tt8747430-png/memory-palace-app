import { LoginForm } from '@/features/auth/components/LoginForm';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your Memory Palace
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          >
            {error}
          </p>
        ) : null}
        <LoginForm />
      </div>
    </div>
  );
}

// Next.js App Router requires a default export for route entry files.
export default LoginPage;
