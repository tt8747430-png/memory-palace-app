import { AuthShell, UpdatePasswordForm } from '@/features/auth';

function UpdatePasswordPage() {
  return (
    <AuthShell
      brandTitle="Almost there."
      brandSubtitle="Set a fresh password and we'll get you back to your palace."
      kicker="New password"
      title="Set a new password."
      subtitle="Choose something memorable — you've got the technique for it."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}

export default UpdatePasswordPage;
