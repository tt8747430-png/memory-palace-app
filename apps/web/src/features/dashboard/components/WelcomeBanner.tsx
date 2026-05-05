import { getCurrentUser } from '@/shared/lib/supabase';

/** Greets the logged-in user by their email handle or full email as a fallback. */
export async function WelcomeBanner() {
  const user = await getCurrentUser();
  const greeting = user?.email?.split('@')[0] ?? 'there';

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">
        Good {timeOfDay}, {greeting} 👋
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to your Memory Palace.</p>
    </div>
  );
}
