import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cinematic p-2 text-white selection:bg-white/30 lg:h-dvh lg:overflow-hidden lg:p-4">
      {children}
    </div>
  );
}
