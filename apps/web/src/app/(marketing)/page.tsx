import type { Metadata } from 'next';
import { LandingHero, StatsBar, FeatureCards, HowItWorks, LandingCta } from '@/features/marketing';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Memory Palace — Spatial Learning for the Modern Mind',
  description:
    'Build virtual memory palaces using the Method of Loci. Connect ideas spatially, review daily, and remember more with less effort.',
  openGraph: {
    title: 'Memory Palace — Spatial Learning for the Modern Mind',
    description:
      'Build virtual memory palaces using the Method of Loci. Connect ideas spatially, review daily, and remember more with less effort.',
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <StatsBar />
      <FeatureCards />
      <HowItWorks />
      <LandingCta />
    </>
  );
}
