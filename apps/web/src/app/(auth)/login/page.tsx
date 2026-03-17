import { LoginForm } from '@/features/auth/components/LoginForm';

function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your Memory Palace
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

// Next.js App Router requires a default export for route entry files.
export default LoginPage;

