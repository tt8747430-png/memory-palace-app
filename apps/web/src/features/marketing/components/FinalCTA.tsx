import Link from 'next/link';
import { BlurText } from '@/shared/components/BlurText';
import { GradientText } from '@/shared/components/GradientText';

/**
 * Final CTA pre-footer. Captures users who scrolled past every earlier
 * CTA without converting. Big heading, two CTAs side-by-side, avatar
 * stack + count below for social proof.
 */
export function FinalCTA() {
  return (
    <section className="relative w-full px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:px-14">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <h2 className="font-heading max-w-4xl text-4xl font-normal leading-[0.95] tracking-[-1.2px] text-foreground sm:text-5xl md:text-7xl md:tracking-[-1.8px]">
          <BlurText text="Build your first " perWordDelay={60} />
          <em className="not-italic">
            <GradientText className="italic">palace</GradientText>
          </em>{' '}
          <BlurText
            text="today."
            perWordDelay={60}
            startDelay={0.25}
            className="text-muted-foreground"
          />
        </h2>
        <p className="font-body mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Free forever for one palace. No card required. Walk in, place a few rooms, and feel the
          method work.
        </p>
        <div className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/signup"
            className="w-full rounded-full bg-foreground px-7 py-3.5 text-center font-body text-sm text-background shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.4)] active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            Begin Journey
          </Link>
          <Link
            href="#capabilities"
            className="liquid-glass w-full rounded-full px-7 py-3.5 text-center font-body text-sm text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground/10 active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            See the method
          </Link>
        </div>

        {/* Avatar stack + count (decorative placeholders) */}
        <div className="mt-12 flex items-center gap-4">
          <div className="flex -space-x-2">
            {['K', 'A', 'M', 'T', 'P'].map((letter, i) => {
              const tints = [
                'bg-gold/25',
                'bg-emerald/25',
                'bg-cyan/25',
                'bg-rose/25',
                'bg-amber/25',
              ];
              return (
                <span
                  key={letter}
                  aria-hidden="true"
                  className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-background ${tints[i]} font-heading text-sm text-foreground`}
                >
                  {letter}
                </span>
              );
            })}
          </div>
          <div className="text-left">
            <div className="font-heading text-lg tracking-tight text-foreground">
              Join 1,000+ builders
            </div>
            <div className="font-body text-xs text-muted-foreground">
              charting their own palaces
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
