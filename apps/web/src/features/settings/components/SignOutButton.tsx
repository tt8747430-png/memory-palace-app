import { LogOut } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { signOut } from '@/shared/lib/signOut';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="md">
        <LogOut className="mr-2 h-4 w-4" aria-hidden />
        Sign out
      </Button>
    </form>
  );
}
