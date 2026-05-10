import type { ReactNode } from 'react';

/**
 * (auth) route-group layout — full-bleed black canvas for the Aurora
 * two-column shell. The brand-pane / form-pane split lives in `AuthShell`
 * so each page can customize the left pane (e.g. the signup 3-step
 * indicator) without the layout having to thread props.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cinematic p-2 text-white selection:bg-white/30 lg:h-dvh lg:overflow-hidden lg:p-4">
      {children}
    </div>
  );
}
