'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 min-h-12"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
