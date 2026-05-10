import type { Metadata } from 'next';
import {
  CinematicBackground,
  CinematicHero,
  Capabilities,
  Features,
  CinematicFooter,
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
    <div className="relative min-h-dvh overflow-hidden bg-cinematic text-foreground">
      <CinematicBackground />
      <div className="relative z-10 flex flex-col">
        <CinematicHero />
        <Capabilities />
        <Features />
        <CinematicFooter />
      </div>
    </div>
  );
}
