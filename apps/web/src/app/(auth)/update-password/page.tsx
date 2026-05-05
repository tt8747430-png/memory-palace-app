import { UpdatePasswordForm } from '@/features/auth/components/UpdatePasswordForm';

function UpdatePasswordPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Set New Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </header>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}

export default UpdatePasswordPage;
