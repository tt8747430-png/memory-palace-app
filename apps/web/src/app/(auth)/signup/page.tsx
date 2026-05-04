import { SignupForm } from '@/features/auth/components/SignupForm';

function SignupPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Create Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start building your Memory Palace</p>
        </header>
        <SignupForm />
      </div>
    </div>
  );
}

export default SignupPage;
