import type { Metadata } from 'next';
import { AmbientOrbs } from './_components/AmbientOrbs';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-dvh flex-col font-display"
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <AmbientOrbs />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
