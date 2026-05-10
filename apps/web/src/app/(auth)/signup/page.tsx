import Link from 'next/link';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { AuthShell, type AuthStep } from '@/features/marketing';

const STEPS: AuthStep[] = [
  { number: 1, text: 'Create your account', active: true },
  { number: 2, text: 'Build your first palace' },
  { number: 3, text: 'Place your first memory' },
];

function SignupPage() {
  return (
    <AuthShell
      brandTitle="Join the palace."
      brandSubtitle="Three short phases — and your first walk-through is live."
      steps={STEPS}
      kicker="Create account"
      title="Begin your palace."
      subtitle="A few details and you're walking through your own world in minutes."
      footer={
        <>
          Already a member?{' '}
          <Link href="/login" className="text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
          .
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}

export default SignupPage;
