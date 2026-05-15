import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-cinematic p-2 text-white selection:bg-white/30 lg:h-svh lg:overflow-hidden lg:p-4">
      {children}
    </div>
  );
}
