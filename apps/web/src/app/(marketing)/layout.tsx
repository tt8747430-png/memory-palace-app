import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/features/marketing';
import { AmbientOrbs } from './_components/AmbientOrbs';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col font-display">
      <AmbientOrbs />
      <MarketingNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
