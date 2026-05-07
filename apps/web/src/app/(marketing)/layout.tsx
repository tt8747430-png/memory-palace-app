import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/features/marketing';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <MarketingNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
