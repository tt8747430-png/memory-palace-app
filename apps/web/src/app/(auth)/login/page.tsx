import { Alert } from '@memory-palace/ui';
import { AuthShell, LoginForm } from '@/features/auth';

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
    >
      <div className="space-y-6">
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <LoginForm />
      </div>
    </AuthShell>
  );
}

export default LoginPage;
