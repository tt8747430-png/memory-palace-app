import type { Metadata } from 'next';
import { AmbientOrbs } from './_components/AmbientOrbs';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

/**
 * Marketing route group layout. Nav + footer live inside individual pages
 * (so the cinematic landing can own its full dark chrome while /about and
 * /join keep the standard themed nav). The shared shell here just provides
 * the column wrapper, ambient orbs, and the skip-link target.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col font-display">
      <AmbientOrbs />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
