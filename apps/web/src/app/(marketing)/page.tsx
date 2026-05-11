import type { Metadata } from 'next';
import {
  CinematicBackground,
  CinematicNav,
  CinematicHero,
  Capabilities,
  Features,
  PalacePreviewRow,
  Comparison,
  WallOfLove,
  Pricing,
  FoundersNote,
  FAQ,
  FinalCTA,
  CinematicFooter,
  ScrollProgress,
} from '@/features/marketing';

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
    <div className="relative min-h-dvh bg-cinematic text-foreground">
      <ScrollProgress />
      <CinematicBackground />
      <div className="relative z-10 flex flex-col">
        <CinematicNav />
        <CinematicHero />
        <Capabilities />
        <PalacePreviewRow />
        <Features />
        <Comparison />
        <FoundersNote />
        <WallOfLove />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <CinematicFooter />
      </div>
    </div>
  );
}
