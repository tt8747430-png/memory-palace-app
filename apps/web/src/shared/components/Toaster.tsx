import { Toaster as SonnerToaster } from '@memory-palace/ui';

/**
 * App-wide toast surface. Mounted once in the root layout.
 * Theme is inherited from the `next-themes` ThemeProvider via CSS variables —
 * sonner reads `--background` / `--foreground` directly.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border bg-card text-foreground shadow-lg',
        },
      }}
    />
  );
}
