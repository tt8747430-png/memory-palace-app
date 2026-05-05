import { getProfile } from '@/features/settings';

/** Greets the logged-in user by their display name. */
export async function WelcomeBanner() {
  const result = await getProfile();
  const name =
    result.success && result.data.displayName.trim() ? result.data.displayName.trim() : 'there';

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">
        Good {timeOfDay}, {name} 👋
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to your Memory Palace.</p>
    </div>
  );
}
