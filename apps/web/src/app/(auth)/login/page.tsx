import Link from 'next/link';
import { Alert } from '@memory-palace/ui';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AuthShell } from '@/features/marketing';

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      brandTitle="Walk back in."
      brandSubtitle="Your rooms, edges, and review streak are exactly where you left them."
      kicker="Sign in"
      title="Welcome back."
      subtitle="Enter your credentials to continue your walk-through."
      footer={
        <>
          New here?{' '}
          <Link href="/join" className="text-white underline-offset-4 hover:underline">
            Start a palace
          </Link>
          .
        </>
      }
    >
      <div className="space-y-6">
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <LoginForm />
      </div>
    </AuthShell>
  );
}

export default LoginPage;
