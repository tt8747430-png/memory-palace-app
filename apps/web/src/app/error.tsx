'use client';

import { Button } from '@memory-palace/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} size="md">
          Try again
        </Button>
      </div>
    </div>
  );
}
