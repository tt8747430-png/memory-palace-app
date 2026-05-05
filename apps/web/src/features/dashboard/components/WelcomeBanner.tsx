import { getUserProfile } from '@/shared/lib/userProfile';

/** Greets the logged-in user by their display name. */
export async function WelcomeBanner() {
  const result = await getUserProfile();
  const name =
    result.success && result.data.displayName.trim() ? result.data.displayName.trim() : 'there';

  return (
    <div>
      {/*
       * Time-of-day greeting is intentionally omitted here: computing it
       * server-side would use the server's UTC clock, not the user's local
       * timezone. When the canvas/client layer is introduced, a client
       * component can derive this from Date().getHours() in the browser.
       */}
      <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {name} 👋</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your Memory Palace awaits.</p>
    </div>
  );
}
