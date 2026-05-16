import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="max-w-prose text-muted-foreground">
        Memory Palace can&apos;t reach the network right now. Your saved palaces and notes will be
        available again as soon as you reconnect.
      </p>
    </main>
  );
}
