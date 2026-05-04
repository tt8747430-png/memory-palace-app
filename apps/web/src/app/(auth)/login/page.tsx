import { Alert } from '@memory-palace/ui';
import { LoginForm } from '@/features/auth/components/LoginForm';

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your Memory Palace</p>
        </header>
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
