import type { Metadata } from 'next';
import { AmbientOrbs } from './_components/AmbientOrbs';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      // bg-cinematic so the home-indicator safe-area band reads as part of
      // the page, not as a white strip below the dark content. Safe-area
      // padding is applied via padding INSIDE this colored region; previously
      // it was applied OUTSIDE which let body color leak through on iOS PWA.
      className="relative flex min-h-dvh flex-col bg-cinematic font-display pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]"
    >
      <AmbientOrbs />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
