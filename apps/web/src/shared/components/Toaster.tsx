import { Toaster as SonnerToaster } from '@/ui';

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
