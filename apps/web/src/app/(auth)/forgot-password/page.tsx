import Link from 'next/link';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { AuthShell } from '@/features/marketing';

function ForgotPasswordPage() {
  return (
    <AuthShell
      brandTitle="Forgot the way in?"
      brandSubtitle="A reset link, straight to your inbox. You'll be back inside in minutes."
      kicker="Reset access"
      title="Reset password."
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="text-white underline-offset-4 hover:underline">
            Back to sign in
          </Link>
          .
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

export default ForgotPasswordPage;
