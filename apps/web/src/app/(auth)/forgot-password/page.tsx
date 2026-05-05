import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </header>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
